import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  CopyButton,
  Drawer,
  Input,
  Select,
  Stack,
  Tabs,
  TextInput,
  Tooltip,
  Modal,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BiDotsHorizontalRounded,
  BiMessageDetail,
  BiMicrophoneOff,
} from "react-icons/bi";
import { BsEmojiSmile, BsFillPeopleFill, BsBarChart } from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";
import { AiOutlinePaperClip } from "react-icons/ai";
import { FaPaperPlane, FaPen, FaUpload, FaChalkboardTeacher } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { PiHandFill } from "react-icons/pi";
import { Link, useNavigate, useParams } from "react-router-dom";
import httpClient, { apiUrl, frontendUrl } from "../config/ApiUrl";
import TimeAgo from "timeago-react";
import * as timeago from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import fr from "timeago.js/lib/lang/fr";
import { MapType } from "../utils/File";
import { notifications } from "@mantine/notifications";
import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
timeago.register("fr", fr);

import joinSFX from "../sounds/join.mp3";
import msgSFX from "../sounds/message.mp3";
import leaveSFX from "../sounds/leave.mp3";
import formatDate, { formatTime } from "../utils/formatDate";
import emojisReactions from "../utils/emojiReaction";
import MyVideoConference from "../components/MyvideoConference";
import LobbyPreview from "../components/LobbyPreview";
import RoomMediaBridge from "../components/RoomMediaBridge";
import PollsPanel, { Poll } from "../components/PollsPanel";
import Whiteboard, { Stroke } from "../components/Whiteboard";

interface emojiReaction {
  emojiId: string;
  done: boolean;
  userId: string;
  image: any;
  roomId: string;
}
interface RoomProps {
  socket: any;
}
interface Message {
  type?: string;
  name?: string;
  url?: string;
  fullname: string;
  senderId: string;
  createdTime: string;
  content: string;
  messageId: string;
  fileType?: string;
  toUserId?: string;
}
interface Participant {
  email: string;
  photoUrl?: string;
  _id: string;
  fullname: string;
  isGuest?: boolean;
}
interface ParticipantData {
  _id: string;
  fullname: string;
  email?: string;
  photoUrl?: string;
  isGuest?: boolean;
}
interface Room {
  adminId: string;
  participants: any[];
  roomName: string;
  startDate: Date;
  waitingQueue?: { user: Participant; socketId?: string }[];
  pinnedIdentity?: string | null;
  polls?: Poll[];
  messages?: Message[];
}

interface WaitingItem {
  user: Participant;
  socketId?: string;
}

function RoomScreen({ socket }: RoomProps) {
  const joinAudio = useRef(new Audio(joinSFX));
  const msgAudio = useRef(new Audio(msgSFX));
  const leaveAudio = useRef(new Audio(leaveSFX));
  const navigate = useNavigate();
  const [timeInMeeting, setTimeInMeeting] = useState<string>("");
  const localStorageData = localStorage.getItem("participant");
  const parsedData: ParticipantData | null = localStorageData
    ? JSON.parse(localStorageData)
    : null;
  const userRef = useRef<ParticipantData | null>(parsedData);
  const params = useParams();
  const roomId = params.roomId || "";

  const [lobbyDone, setLobbyDone] = useState(false);
  const [mediaPrefs, setMediaPrefs] = useState({
    audioEnabled: true,
    videoEnabled: true,
    devices: { audioInputId: "", videoInputId: "", audioOutputId: "" },
  });

  const [Room, setRoom] = useState<Room>({
    adminId: "",
    participants: [],
    roomName: "reunion journaliere",
    startDate: new Date(),
    waitingQueue: [],
    pinnedIdentity: null,
    polls: [],
  });
  const [opened, { open, close }] = useDisclosure(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLLIElement | null>(null);
  const drawerOpenRef = useRef(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [forceMuteToken, setForceMuteToken] = useState(0);
  const [waitingQueue, setWaitingQueue] = useState<WaitingItem[]>([]);
  const [refuseReason, setRefuseReason] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Participant | null>(
    null
  );
  const [LeftParticipant, setLeftParticipant] = useState({ fullname: "" });
  const [ShowLeftParticipant, setShowLeftParticipant] = useState(false);
  const [Messages, setMessages] = useState<Message[]>([]);
  const [dmTargetId, setDmTargetId] = useState<string | "">("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [liveKitToken, setLiveKitToken] = useState<string>("");
  const [handRaiseIds, sethandRaiseIds] = useState<string[]>([]);
  const [Message, setMessageContent] = useState("");
  const [emojiStatus, setEmojiStatus] = useState(false);
  const [emojiReactionPicker, setEmojiReactionPicker] = useState(false);
  const [emojiReactionsMark, setEmojiReactionsMark] = useState<emojiReaction[]>(
    []
  );
  const [openedTitleModal, setOpenedTitleModal] = useState(false);
  const [title, setTitle] = useState("");
  const FileInput = useRef<HTMLInputElement>(null);
  const uniqueMessageIds = useRef(new Set<string>());
  const uniqueEmojisIds = useRef(new Set<string>());
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = userRef.current?._id === Room.adminId;

  const SERVER_LIVEKIT_URL = useMemo(
    () => import.meta.env.VITE_LIVEKIT_HOST,
    []
  );

  const joinUrl = `${frontendUrl}?r=${roomId}`;

  useEffect(() => {
    drawerOpenRef.current = opened;
    if (opened) setUnreadCount(0);
  }, [opened]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [Messages]);

  // Socket channel + room sync as soon as possible (waiting room while in lobby)
  useEffect(() => {
    if (!userRef.current) return;

    socket.emit("registerSocketUser", { userId: userRef.current._id });
    socket.emit("socketJoinRoomChannel", { roomId });
    socket.emit("getRoom", { roomId });

    const onGetRoom = (data: { room: Room }) => {
      if (!data.room) return;
      setRoom(data.room);
      if (data.room.messages) setMessages(data.room.messages);
      if (data.room.polls) setPolls(data.room.polls);
      if (data.room.waitingQueue) setWaitingQueue(data.room.waitingQueue);
      if (typeof data.room.pinnedIdentity !== "undefined") {
        setPinnedIdentity(data.room.pinnedIdentity || null);
      }
    };

    const onWantJoin = (data: {
      roomId: string;
      adminId: string;
      user: Participant;
    }) => {
      if (data.roomId !== roomId) return;
      if (userRef.current?._id === data.adminId) {
        setSelectedCandidate(data.user);
        joinAudio.current.play().catch(() => {});
        notifications.show({
          title: "Demande d'entrée",
          message: `${data.user.fullname} veut rejoindre`,
          color: "blue",
        });
      }
    };

    const onQueue = (data: {
      roomId: string;
      waitingQueue: WaitingItem[];
    }) => {
      if (data.roomId === roomId) setWaitingQueue(data.waitingQueue || []);
    };

    const onJoined = (data: { roomId: string; room: Room }) => {
      if (data.roomId === roomId) {
        setRoom(data.room);
        joinAudio.current.play().catch(() => {});
      }
    };

    const onMsg = (data: { roomId: string; message: Message }) => {
      if (data.roomId !== roomId) return;
      if (uniqueMessageIds.current.has(data.message.messageId)) return;
      if (
        data.message.toUserId &&
        data.message.toUserId !== userRef.current?._id &&
        data.message.senderId !== userRef.current?._id
      ) {
        return;
      }
      uniqueMessageIds.current.add(data.message.messageId);
      setMessages((prev) => [...prev, data.message]);
      if (!drawerOpenRef.current) {
        setUnreadCount((n) => n + 1);
      }
      msgAudio.current.play().catch(() => {});
    };

    const onLeft = (data: {
      roomId: string;
      participant: Participant;
      room: Room;
    }) => {
      if (data.roomId !== roomId) return;
      setLeftParticipant(data.participant);
      setRoom(data.room);
      setShowLeftParticipant(true);
      leaveAudio.current.play().catch(() => {});
      setTimeout(() => setShowLeftParticipant(false), 3000);
    };

    const onRaise = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        sethandRaiseIds((prev) =>
          prev.includes(data.userId) ? prev : [...prev, data.userId]
        );
      }
    };
    const onDown = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        sethandRaiseIds((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    const onTitle = (data: { roomId: string; room: Room }) => {
      if (data.roomId === roomId) setRoom(data.room);
    };

    const onEmoji = (data: emojiReaction) => {
      if (data.roomId !== roomId) return;
      if (uniqueEmojisIds.current.has(data.emojiId)) return;
      uniqueEmojisIds.current.add(data.emojiId);
      setEmojiReactionsMark((prev) => [...prev, data]);
    };

    const onForceMute = () => setForceMuteToken((n) => n + 1);
    const onForceMuteAll = () => setForceMuteToken((n) => n + 1);

    const onKicked = (data: { roomId: string; reason?: string }) => {
      if (data.roomId !== roomId) return;
      notifications.show({
        title: "Expulsé",
        message: data.reason || "Vous avez été retiré de la réunion",
        color: "red",
      });
      navigate("/");
    };

    const onEnded = (data: { roomId: string }) => {
      if (data.roomId !== roomId) return;
      notifications.show({
        title: "Réunion terminée",
        message: "L'organisateur a mis fin à la réunion",
        color: "orange",
      });
      navigate("/");
    };

    const onPinned = (data: {
      roomId: string;
      pinnedIdentity?: string | null;
      identity?: string | null;
    }) => {
      if (data.roomId === roomId) {
        setPinnedIdentity(
          data.pinnedIdentity ?? data.identity ?? null
        );
      }
    };

    const onTyping = (data: {
      roomId: string;
      userId: string;
      fullname: string;
      isTyping: boolean;
      toUserId?: string;
    }) => {
      if (data.roomId !== roomId) return;
      if (data.userId === userRef.current?._id) return;
      if (
        data.toUserId &&
        data.toUserId !== userRef.current?._id &&
        data.userId !== userRef.current?._id
      ) {
        return;
      }
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.fullname)
            ? prev
            : [...prev, data.fullname];
        }
        return prev.filter((n) => n !== data.fullname);
      });
    };

    const onPoll = (data: { roomId: string; polls: Poll[] }) => {
      if (data.roomId === roomId) setPolls(data.polls || []);
    };

    const onWhiteboard = (data: { roomId: string; stroke: Stroke }) => {
      if (data.roomId === roomId) {
        setStrokes((prev) => [...prev, data.stroke]);
      }
    };

    const onWhiteboardClear = (data: { roomId: string }) => {
      if (data.roomId === roomId) setStrokes([]);
    };

    socket.on("getRoom", onGetRoom);
    socket.on("somebodyWantToJoinRoom", onWantJoin);
    socket.on("waitingQueueUpdate", onQueue);
    socket.on("somebodyJoined", onJoined);
    socket.on("receiveMessage", onMsg);
    socket.on("leftMeeting", onLeft);
    socket.on("raiseHand", onRaise);
    socket.on("putHandDown", onDown);
    socket.on("updateTitle", onTitle);
    socket.on("emojiReaction", onEmoji);
    socket.on("forceMute", onForceMute);
    socket.on("forceMuteAll", onForceMuteAll);
    socket.on("kicked", onKicked);
    socket.on("meetingEnded", onEnded);
    socket.on("pinnedUpdated", onPinned);
    socket.on("userTyping", onTyping);
    socket.on("pollUpdated", onPoll);
    socket.on("whiteboardDraw", onWhiteboard);
    socket.on("whiteboardClear", onWhiteboardClear);

    return () => {
      socket.off("getRoom", onGetRoom);
      socket.off("somebodyWantToJoinRoom", onWantJoin);
      socket.off("waitingQueueUpdate", onQueue);
      socket.off("somebodyJoined", onJoined);
      socket.off("receiveMessage", onMsg);
      socket.off("leftMeeting", onLeft);
      socket.off("raiseHand", onRaise);
      socket.off("putHandDown", onDown);
      socket.off("updateTitle", onTitle);
      socket.off("emojiReaction", onEmoji);
      socket.off("forceMute", onForceMute);
      socket.off("forceMuteAll", onForceMuteAll);
      socket.off("kicked", onKicked);
      socket.off("meetingEnded", onEnded);
      socket.off("pinnedUpdated", onPinned);
      socket.off("userTyping", onTyping);
      socket.off("pollUpdated", onPoll);
      socket.off("whiteboardDraw", onWhiteboard);
      socket.off("whiteboardClear", onWhiteboardClear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // LiveKit token only after lobby
  useEffect(() => {
    if (!lobbyDone || !userRef.current) return;
    socket.emit("getLiveKitToken", { roomId, user: userRef.current });
    const onToken = (data: {
      token: string;
      userId: string;
      roomId: string;
    }) => {
      if (data.roomId === roomId && data.userId === userRef.current?._id) {
        setLiveKitToken(data.token);
      }
    };
    socket.on("liveKitToken", onToken);
    return () => {
      socket.off("liveKitToken", onToken);
    };
  }, [lobbyDone, roomId, socket]);

  useEffect(() => {
    if (!lobbyDone) return;
    const id = setInterval(() => {
      setTimeInMeeting(formatTime(Room.startDate));
    }, 1000);
    return () => clearInterval(id);
  }, [lobbyDone, Room.startDate]);

  const answerCandidature = (accept: boolean, user: Participant) => {
    socket.emit("AnwserToCandidature", {
      answer: accept,
      roomId,
      user,
      reason: accept ? undefined : refuseReason || "Refusé par l'organisateur",
    });
    setSelectedCandidate(null);
    setRefuseReason("");
  };

  const LeftMeeting = () => {
    socket.emit("leftMeeting", { roomId, user: userRef.current });
    navigate("/");
  };

  const emitTyping = (isTyping: boolean) => {
    socket.emit("typing", {
      roomId,
      userId: userRef.current?._id,
      fullname: userRef.current?.fullname,
      isTyping,
      toUserId: dmTargetId || undefined,
    });
  };

  const sendMessage = () => {
    if (!Message.trim()) return;
    const message: Message = {
      fullname: userRef.current?.fullname || "",
      senderId: userRef.current?._id || "",
      createdTime: new Date().toISOString(),
      content: Message,
      messageId: Math.random().toString(36).slice(2),
      toUserId: dmTargetId || undefined,
    };
    socket.emit("sendMessage", { message, roomId, toUserId: dmTargetId || undefined });
    setMessageContent("");
    emitTyping(false);
  };

  const EmojiPickerHandler = (emojiData: any) => {
    setMessageContent(Message + emojiData.emoji);
  };

  const FileHandler = async (e: any) => {
    try {
      const formData = new FormData();
      formData.append("document", e.target.files[0]);
      formData.append("roomId", roomId);
      formData.append("senderId", userRef.current?._id || "");
      formData.append("fullname", userRef.current?.fullname || "");
      await httpClient.post("/auth/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notifications.show({
        title: "Upload",
        color: "green",
        message: "Fichier envoyé",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const identity = () =>
    userRef.current?.fullname.replace(/\s/g, "_") || "";

  const handRaise = () =>
    socket.emit("raiseHand", { roomId, userId: identity() });
  const putHandDown = () =>
    socket.emit("putHandDown", { roomId, userId: identity() });

  const updateTitle = () => {
    socket.emit("updateTitle", { roomId, title });
    setOpenedTitleModal(false);
  };

  const pickEmoji = (image: any) => {
    socket.emit("emojiReaction", {
      userId: userRef.current?._id || "",
      image,
      done: false,
      roomId,
      emojiId: Math.random().toString(),
    });
  };

  const getUserNameByUserId = (userId: string) => {
    const user = Room.participants.find((p) => p._id === userId);
    if (!user) return "gone";
    return userRef.current?._id === userId ? "you" : user.fullname;
  };

  const muteParticipant = (p: Participant) => {
    socket.emit("muteParticipant", {
      roomId,
      adminId: userRef.current?._id,
      targetUserId: p._id,
      identity: p.fullname.replace(/\s/g, "_"),
    });
  };

  const kickParticipant = (p: Participant) => {
    socket.emit("kickParticipant", {
      roomId,
      adminId: userRef.current?._id,
      targetUserId: p._id,
      identity: p.fullname.replace(/\s/g, "_"),
    });
  };

  const muteAll = () => {
    socket.emit("muteAll", { roomId, adminId: userRef.current?._id });
  };

  const endMeeting = () => {
    socket.emit("endMeeting", { roomId, adminId: userRef.current?._id });
  };

  const onLocalPinChange = (ident: string | null) => {
    if (!isAdmin) {
      setPinnedIdentity(ident);
      return;
    }
    socket.emit("setPinnedParticipant", {
      roomId,
      adminId: userRef.current?._id,
      identity: ident,
    });
  };

  if (!userRef.current) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Stack align="center">
          <Text>Connectez-vous ou rejoignez en invité depuis l'accueil.</Text>
          <Button onClick={() => navigate("/")}>Accueil</Button>
        </Stack>
      </div>
    );
  }

  const waitingPanel =
    isAdmin && waitingQueue.length > 0 ? (
      <div className="absolute top-4 right-4 z-[120] w-80 bg-white shadow-xl rounded-xl p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
        <p className="font-semibold text-sm">
          Salle d'attente ({waitingQueue.length})
        </p>
        {waitingQueue.map((item) => (
          <div
            key={item.user._id}
            className="border rounded-lg p-2 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Avatar
                radius="xl"
                src={
                  item.user.photoUrl ? apiUrl + item.user.photoUrl : undefined
                }
                size={28}
              >
                {item.user.fullname?.[0]}
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.user.fullname}</p>
                {item.user.isGuest && (
                  <p className="text-xs text-gray-400">Guest</p>
                )}
              </div>
            </div>
            <TextInput
              size="xs"
              placeholder="Motif si refus"
              value={
                selectedCandidate?._id === item.user._id ? refuseReason : ""
              }
              onChange={(e) => {
                setSelectedCandidate(item.user);
                setRefuseReason(e.currentTarget.value);
              }}
            />
            <div className="flex gap-2">
              <Button
                size="xs"
                className="bg-blue-600 flex-1"
                onClick={() => answerCandidature(true, item.user)}
              >
                Accepter
              </Button>
              <Button
                size="xs"
                variant="outline"
                color="red"
                className="flex-1"
                onClick={() => {
                  setSelectedCandidate(item.user);
                  answerCandidature(false, item.user);
                }}
              >
                Refuser
              </Button>
            </div>
          </div>
        ))}
      </div>
    ) : null;

  if (!lobbyDone) {
    return (
      <>
        {waitingPanel}
        <LobbyPreview
          roomLabel={roomId}
          onCancel={() => navigate("/")}
          onJoin={(opts) => {
            setMediaPrefs(opts);
            setLobbyDone(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 relative">
      <Modal
        title="titre de la reunion"
        centered
        opened={openedTitleModal}
        onClose={() => setOpenedTitleModal(false)}
      >
        <Stack>
          <TextInput
            onChange={(e) => setTitle(e.target.value)}
            placeholder={Room.roomName}
          />
          <Button
            style={{ backgroundColor: "#1877f3" }}
            leftIcon={<FaUpload />}
            onClick={() => updateTitle()}
          >
            sauvergarder
          </Button>
        </Stack>
      </Modal>

      <input
        ref={FileInput}
        type="file"
        className="hidden"
        onChange={FileHandler}
      />

      {waitingPanel}

      <div
        className={`w-[23rem] h-[3rem] bg-black rounded-xl absolute bottom-10 gap-x-2 items-center px-2 justify-center left-4 ${
          ShowLeftParticipant ? "translate-y-[0rem]" : "translate-y-[12rem]"
        } transition duration-[200ms] z-40 flex p-3`}
      >
        <p className="text-white">{LeftParticipant.fullname}</p>
        <p className="text-white">left</p>
      </div>

      <Drawer position="right" opened={opened} onClose={close} size="md">
        <Tabs defaultValue="messages">
          <Tabs.List>
            <Tabs.Tab value="polls" icon={<BsBarChart size="0.8rem" />}>
              Sondages
            </Tabs.Tab>
            <Tabs.Tab value="board" icon={<FaChalkboardTeacher size="0.8rem" />}>
              Board
            </Tabs.Tab>
            <Tabs.Tab value="messages" icon={<BiMessageDetail size="0.8rem" />}>
              Messages
            </Tabs.Tab>
            <Tabs.Tab
              value="participants"
              rightSection={
                <Badge
                  w={16}
                  h={16}
                  color="gray"
                  sx={{ pointerEvents: "none" }}
                  variant="filled"
                  size="xs"
                  p={0}
                >
                  {Room.participants.length}
                </Badge>
              }
              icon={<BsFillPeopleFill size="0.8rem" />}
            >
              Participants
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="polls" pt="xs">
            <PollsPanel
              polls={polls}
              userId={userRef.current._id}
              isAdmin={!!isAdmin}
              onCreate={(question, options) =>
                socket.emit("createPoll", {
                  roomId,
                  userId: userRef.current?._id,
                  question,
                  options,
                })
              }
              onVote={(pollId, optionId) =>
                socket.emit("votePoll", {
                  roomId,
                  userId: userRef.current?._id,
                  pollId,
                  optionId,
                })
              }
              onClosePoll={(pollId) =>
                socket.emit("closePoll", {
                  roomId,
                  adminId: userRef.current?._id,
                  pollId,
                })
              }
            />
          </Tabs.Panel>

          <Tabs.Panel value="board" pt="xs">
            <Whiteboard
              strokes={strokes}
              onStroke={(stroke) => {
                setStrokes((prev) => [...prev, stroke]);
                socket.emit("whiteboardDraw", { roomId, stroke });
              }}
              onClear={() => {
                setStrokes([]);
                socket.emit("whiteboardClear", { roomId });
              }}
              onUndo={() =>
                setStrokes((prev) => prev.slice(0, Math.max(0, prev.length - 1)))
              }
            />
          </Tabs.Panel>

          <Tabs.Panel value="messages" pt="xs">
            <div className="flex flex-col h-[85vh]">
              <Select
                mb="xs"
                clearable
                placeholder="Chat privé (optionnel)"
                value={dmTargetId}
                onChange={(v) => setDmTargetId(v || "")}
                data={Room.participants
                  .filter((p) => p._id !== userRef.current?._id)
                  .map((p) => ({
                    value: p._id,
                    label: p.isGuest ? `${p.fullname} (Guest)` : p.fullname,
                  }))}
              />
              {typingUsers.length > 0 && (
                <Text size="xs" c="dimmed" mb={4}>
                  {typingUsers.join(", ")} écrit…
                </Text>
              )}
              <ul className="flex-1 flex-col overflow-y-scroll gap-y-4 flex list-none">
                {Messages.map((message: Message, idx) => {
                  if (message.type === "file") {
                    return (
                      <li
                        key={message.messageId || message.url}
                        ref={idx === Messages.length - 1 ? messagesEndRef : undefined}
                        className={`min-h-[3rem] p-3 flex-col ${
                          message.fullname === userRef.current?.fullname
                            ? "self-end"
                            : "self-start"
                        } cursor-pointer max-w-[80%] flex px-2 items-center`}
                      >
                        <p className="font-semibold">
                          {message.fullname === userRef.current?.fullname
                            ? "vous"
                            : message.fullname}
                          {message.toUserId ? " (privé)" : ""}
                        </p>
                        <div
                          className={`flex-1 flex rounded-lg p-3 ${
                            message.senderId === userRef.current?._id
                              ? "self-end bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        >
                          <img
                            src={
                              MapType.has(
                                `${(message.fileType || "").split("/")[1]}`
                              )
                                ? MapType.get(
                                    `${(message.fileType || "").split("/")[1]}`
                                  )
                                : MapType.get("unknown")
                            }
                            className="h-8 w-8"
                          />
                          <Link
                            target="_blank"
                            className={
                              message.senderId === userRef.current?._id
                                ? "text-white"
                                : "text-black"
                            }
                            to={apiUrl + message.url}
                          >
                            {message.name}
                          </Link>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={message.messageId}
                      ref={idx === Messages.length - 1 ? messagesEndRef : undefined}
                      className={`min-h-[4rem] ${
                        message.senderId === userRef.current?._id
                          ? "self-end"
                          : ""
                      } max-w-[70%] px-4 gap-x-3 flex-col flex`}
                    >
                      <p className="font-semibold self-end">
                        {message.fullname === userRef.current?.fullname
                          ? "vous"
                          : message.fullname}
                        {message.toUserId ? " (privé)" : ""}
                      </p>
                      <div
                        className={`flex-1 h-auto flex flex-col p-4 rounded-lg ${
                          message.senderId === userRef.current?._id
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <p
                          className={
                            message.senderId === userRef.current?._id
                              ? "text-white"
                              : "text-black"
                          }
                        >
                          {message.content}
                        </p>
                        <p
                          className={
                            message.senderId === userRef.current?._id
                              ? "text-white text-sm self-end"
                              : "text-sm self-end text-black"
                          }
                        >
                          <TimeAgo
                            locale="fr"
                            datetime={message.createdTime}
                          />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {emojiStatus && (
                <div className="absolute bottom-20 right-2">
                  <EmojiPicker onEmojiClick={EmojiPickerHandler} />
                </div>
              )}
              <div className="h-[4rem] p-4 flex items-center w-full gap-x-2 border-t-2">
                <AiOutlinePaperClip
                  onClick={() => FileInput.current?.click()}
                  className="cursor-pointer"
                  size={24}
                />
                <Input
                  rightSection={
                    <BsEmojiSmile
                      onClick={() => setEmojiStatus(!emojiStatus)}
                      size={24}
                      className="mr-3 cursor-pointer"
                    />
                  }
                  onChange={(e: FormEvent<HTMLInputElement>) => {
                    setMessageContent(e.currentTarget.value);
                    emitTyping(true);
                    if (typingTimeout.current)
                      clearTimeout(typingTimeout.current);
                    typingTimeout.current = setTimeout(
                      () => emitTyping(false),
                      1200
                    );
                  }}
                  placeholder="entrez votre message"
                  className="flex-1"
                  size="md"
                  value={Message}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <Button
                  onClick={() => sendMessage()}
                  className="bg-blue-700 hover:bg-blue-900 p-2"
                >
                  <FaPaperPlane size={20} color="white" />
                </Button>
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="participants" pt="xs">
            {isAdmin && (
              <div className="flex gap-2 mb-3">
                <Button size="xs" variant="outline" onClick={muteAll}>
                  Mute all
                </Button>
                <Button size="xs" color="red" onClick={endMeeting}>
                  End meeting
                </Button>
              </div>
            )}
            <ul className="flex-1 h-[80vh] list-none overflow-y-auto">
              {Room.participants.map((participant: Participant, indx: number) => (
                <li
                  key={participant._id || indx.toString()}
                  className="h-auto py-2 px-2 gap-x-3 flex items-center"
                >
                  <Avatar
                    src={
                      participant.photoUrl
                        ? apiUrl + participant.photoUrl
                        : undefined
                    }
                    radius={30}
                    size={50}
                  >
                    {participant.fullname?.[0]}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {userRef.current?.fullname === participant.fullname
                        ? "Vous"
                        : participant.fullname}{" "}
                      {participant._id === Room.adminId
                        ? `(organisateur)`
                        : ""}
                      {participant.isGuest ? " · Guest" : ""}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {participant.email}
                    </p>
                  </div>
                  {isAdmin && participant._id !== userRef.current?._id && (
                    <div className="flex gap-1">
                      <div
                        onClick={() => muteParticipant(participant)}
                        className="bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full"
                        title="Mute"
                      >
                        <BiMicrophoneOff color="white" />
                      </div>
                      <Button
                        size="xs"
                        color="red"
                        variant="outline"
                        onClick={() => kickParticipant(participant)}
                      >
                        Kick
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() =>
                          onLocalPinChange(
                            participant.fullname.replace(/\s/g, "_")
                          )
                        }
                      >
                        Pin
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Tabs.Panel>
        </Tabs>
      </Drawer>

      <h2 className="text-gray-400">{formatDate(Room.startDate)}</h2>
      <div className="h-[3rem] w-full flex items-center justify-between">
        <div className="flex gap-x-3 items-center">
          <p className="text-xl font-semibold">{Room.roomName}</p>
          {isAdmin && (
            <div
              onClick={() => setOpenedTitleModal(true)}
              className="cursor-pointer flex items-center justify-center h-8 w-8 bg-gray-200 hover:bg-gray-400 rounded-full"
            >
              <FaPen size={15} />
            </div>
          )}
        </div>
        <div className="h-[2.3rem] bg-white w-[8rem] drop-shadow-md border justify-center flex items-center rounded-full">
          <p className="text-lg text-gray-400 font-semibold tracking-wider">
            {timeInMeeting}
          </p>
        </div>
      </div>

      <LiveKitRoom
        token={liveKitToken}
        serverUrl={SERVER_LIVEKIT_URL}
        video={mediaPrefs.videoEnabled}
        audio={mediaPrefs.audioEnabled}
        data-lk-theme="default"
        style={{ height: "80vh" }}
      >
        <MyVideoConference
          handRaiseIds={handRaiseIds}
          pinnedIdentity={pinnedIdentity}
          onLocalPinChange={onLocalPinChange}
        />
        <RoomAudioRenderer />
        <RoomMediaBridge
          forceMuteToken={forceMuteToken}
          settingsOpened={settingsOpened}
          onCloseSettings={() => setSettingsOpened(false)}
          blurEnabled={blurEnabled}
          onBlurChange={setBlurEnabled}
          initialAudio={mediaPrefs.audioEnabled}
          initialVideo={mediaPrefs.videoEnabled}
          initialDevices={mediaPrefs.devices}
          onToggleHand={() =>
            handRaiseIds.includes(identity()) ? putHandDown() : handRaise()
          }
          onLeave={LeftMeeting}
        />

        <div className="h-[3.5rem] w-full flex items-center justify-between">
          <div className="h-[2.3rem] bg-white p-2 w-auto min-w-[12rem] gap-x-3 border-[0.09rem] border-gray-400 justify-center flex items-center rounded-md">
            <p className="text-base text-gray-400 tracking-wider">{roomId}</p>
            <div className="h-full w-[0.1rem] bg-gray-200"></div>
            <CopyButton value={joinUrl} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Copied" : "Copy"}
                  withArrow
                  position="right"
                >
                  <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                    <IoCopyOutline className="cursor-pointer" />
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </div>

          <div className="h-auto p-2 min-w-[12rem] gap-x-3 relative border-gray-400 justify-center flex items-center rounded-md">
            <ControlBar controls={{ leave: false }} variation="minimal" />
            <div className="relative">
              {emojiReactionPicker && (
                <div className="h-18 absolute z-50 p-3 bottom-14 left-auto rounded-full bg-white flex gap-x-4">
                  {emojisReactions.map((emoji) => (
                    <div
                      key={emoji.image}
                      onClick={() => pickEmoji(emoji.image)}
                      className="cursor-pointer flex items-center justify-center h-8 w-8 bg-gray-200 hover:bg-gray-400 rounded-full"
                    >
                      {emoji.image}
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => setEmojiReactionPicker(!emojiReactionPicker)}
                className={`${
                  emojiReactionPicker ? "bg-black" : "bg-white"
                } shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md`}
              >
                <BsEmojiSmile
                  size={14}
                  color={emojiReactionPicker ? "white" : "gray"}
                />
              </div>
            </div>

            <div
              onClick={() =>
                handRaiseIds.includes(identity()) ? putHandDown() : handRaise()
              }
              className={`${
                handRaiseIds.includes(identity()) ? "bg-black" : "bg-white"
              } shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md`}
            >
              <PiHandFill
                color={handRaiseIds.includes(identity()) ? "white" : "gray"}
              />
            </div>

            <div
              onClick={() => setSettingsOpened(true)}
              className="bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md"
              title="Paramètres"
            >
              <FiSettings color="gray" />
            </div>

            <div
              onClick={open}
              className="bg-white relative shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md"
            >
              <BiDotsHorizontalRounded color="gray" />
              {unreadCount > 0 && (
                <Badge
                  size="xs"
                  color="red"
                  variant="filled"
                  className="absolute -top-1 -right-1"
                  sx={{ pointerEvents: "none" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </div>
          </div>

          <Button
            onClick={() => LeftMeeting()}
            className="bg-red-500 hover:bg-red-700"
          >
            Leave meet
          </Button>
        </div>
      </LiveKitRoom>

      {emojiReactionsMark.map((em, index) => (
        <div
          key={em.emojiId}
          className={`w-auto absolute flex flex-col justify-center gap-y-4 items-center z-50 ${
            index % 2 === 0 ? "left-24" : "left-6"
          } transition-opacity duration-3000 opacity-0 animate-fade-in`}
        >
          <div className="h-8 w-8 rounded-full text-lg items-center flex justify-center">
            {em.image}
          </div>
          <div
            style={{ minWidth: "6rem" }}
            className="bg-blue-400 h-8 px-4 flex items-center justify-center rounded-full"
          >
            <p className="text-md font-medium">
              {getUserNameByUserId(em.userId)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RoomScreen;
