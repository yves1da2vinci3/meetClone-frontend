import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  CopyButton,
  Drawer,
  Input,
  Menu,
  Stack,
  Stepper,
  Tabs,
  TextInput,
  Tooltip,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BiDotsHorizontalRounded,
  BiMessageDetail,
  BiMicrophone,
  BiMicrophoneOff,
  BiSolidVideo,
  BiSolidVideoOff,
} from "react-icons/bi";
import {
  BsEmojiSmile,
  BsFillPeopleFill,
  BsListTask,
  BsRecordBtn,
} from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";
import { AiOutlinePaperClip } from "react-icons/ai";
import { MdScreenShare } from "react-icons/md";
import { FaPaperPlane, FaPen, FaUpload } from "react-icons/fa";
import { PiHandFill } from "react-icons/pi";
import { Link, useNavigate, useParams } from "react-router-dom";
import httpClient, { apiUrl, frontendUrl } from "../config/ApiUrl";
import TimeAgo from "timeago-react";
import * as timeago from "timeago.js";
import EmojiPicker from "emoji-picker-react";
// import it first.
import fr from "timeago.js/lib/lang/fr";
import { MapType } from "../utils/File";
import { notifications } from "@mantine/notifications";
import calculateGridTemplateAreas from "../utils/CalculateTemplateAreas";

// LiveKit imporration
import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  useLiveKitRoom,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
// register it.
timeago.register("fr", fr);

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
  fileType: string;
}

interface Participant {
  email: string;
  photoUrl?: string;
  _id: string;
  fullname: string;
}

interface ParticipantData {
  // Define the properties of the Participant data object
  // Replace these with the actual properties in your data
  _id: string;
  fullname: string;
  // Add more properties as needed
}

interface Room {
  adminId: string;
  participants: any[];
  roomName: string;
  startDate: Date;
}
import joinSFX from "../sounds/join.mp3";
import msgSFX from "../sounds/message.mp3";
import leaveSFX from "../sounds/leave.mp3";
import MeetGrid from "../components/MeetGrid";
import formatDate, { formatTime } from "../utils/formatDate";
import emojisReactions from "../utils/emojiReaction";
import MyVideoConference from "../components/MyvideoConference";

function RoomScreen({ socket }: RoomProps) {
  const joinAudio = useRef(new Audio(joinSFX));
  const msgAudio = useRef(new Audio(msgSFX));
  const leaveAudio = useRef(new Audio(leaveSFX));
  const navigate = useNavigate();
  const [timeInMeeting, setTimeInMeeting] = useState<string>("");
  const localStorageData = localStorage.getItem("participant");

  // Parse the data if it exists, or set to null if not found
  const parsedData: ParticipantData | null = localStorageData
    ? JSON.parse(localStorageData)
    : null;
  const userRef = useRef<ParticipantData | null>(parsedData);
  const params = useParams();
  const [Room, setRoom] = useState<Room>({
    adminId: "",
    participants: [],
    roomName: "reunion journaliere",
    startDate: new Date(),
  });
  const [opened, { open, close }] = useDisclosure(false);
  const [active, setActive] = useState(1);
  const [candidate, setCandidate] = useState({ photoUrl: "", fullname: "" });
  const [LeftParticipant, setLeftParticipant] = useState({ fullname: "" });
  const [ShowLeftParticipant, setShowLeftParticipant] = useState(false);
  const [Messages, setMessages] = useState<Message[]>([]);
  // Use a Set to store the unique messageId values

  const uniqueMessageIds = new Set<string>();
  const uniqueEmojisIds = new Set<string>();
  useEffect(() => {
    // get the Room
    socket.emit("getRoom", {
      roomId: params.roomId,
    });

    socket.on("getRoom", (data: { room: Room }) => {
      setRoom(data.room);
    });

    // LiveKit Initlization
    socket.emit("getLiveKitToken", {
      roomId: params.roomId,
      user: userRef?.current,
    });
    socket.on(
      "liveKitToken",
      (data: { token: string; userId: string; roomId: string }) => {
        if (data.roomId === params.roomId) {
          if (data.userId === userRef?.current?._id) {
            setLiveKitToken(data.token);
          }
        }
      }
    );
    // somebody wants to join
    socket.on(
      "somebodyWantToJoinRoom",
      (data: { roomId: string; adminId: string; user: any }) => {
        if (data.roomId === params.roomId) {
          if (userRef?.current?._id === data.adminId) {
            setCandidate(data.user);
            toggle();
          }
        }
      }
    );

    // User Join
    socket.on("somebodyJoined", (data: { roomId: string; room: Room }) => {
      if (data.roomId === params.roomId) {
        setRoom(data.room);
        joinAudio.current.play();
      }
    });

    // Message received
    socket.on(
      "receiveMessage",
      (data: { roomId: string; message: Message }) => {
        if (
          data.roomId === params.roomId &&
          !uniqueMessageIds.has(data.message.messageId)
        ) {
          // Add the message to the state and the Set if it's not already present
          setMessages((prevMessages: Message[]) => [
            ...prevMessages,
            data.message,
          ]);
          uniqueMessageIds.add(data.message.messageId);
          msgAudio.current.play();
        }
      }
    );

    // Left the Meet
    socket.on(
      "leftMeeting",
      (data: { roomId: string; participant: any; room: Room }) => {
        if (data.roomId === params.roomId) {
          setLeftParticipant(data.participant);
          setRoom(data.room);
          setShowLeftParticipant(true);

          leaveAudio.current.play();
          setTimeout(() => {
            setShowLeftParticipant(false);
          }, 3000);
        }
      }
    );

    // HandRaise
    // Socket event handling for raising hand
    socket.on("raiseHand", (data: { roomId: string; userId: string }) => {
      console.log("hand :", data);
      if (data.roomId === params.roomId) {
        sethandRaiseIds((prevHandRaiseIds: string[]) => [
          ...prevHandRaiseIds,
          data.userId,
        ]);
      }
    });

    // Socket event handling for putting hand down
    socket.on("putHandDown", (data: { roomId: string; userId: string }) => {
      if (data.roomId === params.roomId) {
        sethandRaiseIds((prevHandRaiseIds: string[]) =>
          prevHandRaiseIds.filter((id) => id !== data.userId)
        );
      }
    });

    // Handle update Title
    socket.on(
      "updateTitle",
      (data: { roomId: string; title: string; room: Room }) => {
        if (data.roomId === params.roomId) {
          const newRoom: Room = { ...Room, roomName: data.title };
          setRoom(data.room);
        }
      }
    );

    // Emoji Reaction
    socket.on("emojiReaction", (data: emojiReaction) => {
      if (data.roomId === params.roomId && !uniqueEmojisIds.has(data.emojiId)) {
        console.log("new emoji reaction:", data);
        setEmojiReactionsMark((prevState) => [...prevState, data]);
        uniqueEmojisIds.add(data.emojiId);
      }
    });
  }, []);
  // Manage user asking to join
  const [showCandidate, setShowCandidate] = useState(false);

  const toggle = () => {
    setShowCandidate(!showCandidate);
  };

  const answerCandidature = (Adminanswer: string): void => {
    socket.emit("AnwserToCandidature", {
      answer: Adminanswer === "accept" ? true : false,
      roomId: params.roomId,
      user: candidate,
    });
    toggle();
  };
  const LeftMeeting = (): void => {
    socket.emit("leftMeeting", {
      roomId: params.roomId,
      user: userRef.current,
    });
    navigate("/");
  };

  // Manage Message
  const [Message, setMessageContent] = useState("");

  const sendMessage = () => {
    const message = {
      fullname: userRef?.current?.fullname,
      senderId: userRef?.current?._id,
      createdTime: new Date().toISOString(),
      content: Message,
      messageId: Math.random(),
    };
    socket.emit("sendMessage", {
      message,
      roomId: params.roomId,
    });
    setMessageContent("");
  };
  //  Emoji
  const EmojiPickerHandler = (emojiData: any) => {
    setMessageContent(Message + emojiData.emoji);
  };
  const [emojiStatus, setEmojiStatus] = useState(false);

  // Handle file
  const FileInput = useRef<HTMLInputElement>(null);

  const FileHandler = async (e: any) => {
    try {
      const formData = new FormData();
      const roomId: string = params.roomId || "";
      formData.append("document", e.target.files[0]);
      formData.append("roomId", roomId);
      formData.append("senderId", userRef?.current?._id || "");
      formData.append("fullname", userRef?.current?.fullname || "");

      // Make the API call to your backend server for user signup
      await httpClient.post("/auth/document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      notifications.show({
        title: "Feedback About file Upload",
        color: "green",
        message: `File Uploaded successfully`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  //  Check
  const [GridStyle, setGridStyle] = useState({});

  useEffect(() => {
    const gridTemplateAreas = calculateGridTemplateAreas(
      Room.participants.length
    );
    const gridStyle = {
      gridTemplateAreas: gridTemplateAreas,
    };
    setGridStyle(gridStyle);
  }, [Room]);

  // Hand Raise
  const [handRaiseIds, sethandRaiseIds] = useState<any>([]);

  const handRaise = async () => {
    socket.emit("raiseHand", {
      roomId: params.roomId,
      userId: userRef?.current?.fullname.replace(/\s/g, "_"),
    });
  };

  const putHandDown = async () => {
    socket.emit("putHandDown", {
      roomId: params.roomId,
      userId: userRef?.current?.fullname.replace(/\s/g, "_"),
    });
  };

  // Time in mett
  setTimeout(() => {
    const newTime = formatTime(Room.startDate);
    setTimeInMeeting(newTime);
  }, 1000);

  // manage Meet Title
  const [openedTitleModal, setOpenedTitleModal] = useState(false);
  const [title, setTitle] = useState("");

  const updateTitle = async () => {
    socket.emit("updateTitle", {
      roomId: params.roomId,
      title: title,
    });
    setOpenedTitleModal(false);
  };

  // ** emoji reaction
  const [emojiReactionPicker, setEmojiReactionPicker] = useState(false);
  const [emojiReactionsMark, setEmojiReactionsMark] = useState<emojiReaction[]>(
    []
  );

  const pickEmoji = (image: any) => {
    const userReaction: emojiReaction = {
      userId: userRef.current?._id || "",
      image,
      done: false,
      roomId: params.roomId || "",
      emojiId: Math.random().toString(),
    };
    socket.emit("emojiReaction", userReaction);
  };

  const getUserNameByUserId = (userId: string) => {
    const user = Room.participants.filter(
      (participant) => participant._id === userId
    )[0];
    if (user) {
      return userRef.current?._id === userId ? "you" : user.fullname;
    } else {
      return "gone";
    }
  };

  // Function to render emoji reactions
  const renderEmojiReactions = () => {
    return emojiReactionsMark.map((em, index) => (
      <div
        key={index}
        className={`w-auto absolute flex flex-col justify-center gap-y-4 items-center z-50 ${
          index % 2 === 0 ? "left-24" : "left-6"
        }  transition-opacity duration-3000 opacity-0 animate-fade-in`}
      >
        <div className="h-8 w-8 rounded-full text-lg  items-center flex justify-center">
          {em.image}
        </div>
        <div
          style={{
            minWidth: "6rem",
          }}
          className="bg-blue-400 h-8  px-4 flex items-center justify-center rounded-full"
        >
          <p className="text-md font-medium">
            {getUserNameByUserId(em.userId)}
          </p>
        </div>
      </div>
    ));
  };

  // Handle Media with LiveKit

  const SERVER_LIVEKIT_URL = useMemo(() => {
    return import.meta.env.VITE_LIVEKIT_HOST;
  }, []);

  const [liveKitToken, setLiveKitToken] = useState<string>("");

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 relative">
      {/* Modify Meeting Modal  */}
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
            style={{
              backgroundColor: "#1877f3",
            }}
            leftIcon={<FaUpload />}
            onClick={() => updateTitle()}
          >
            sauvergarder
          </Button>
        </Stack>
      </Modal>
      {/* <video ref={videoRef} autoPlay playsInline /> */}
      <input
        ref={FileInput}
        type="file"
        className="hidden"
        onChange={FileHandler}
      />
      {/* Notification to join the meet */}
      <div
        className={`w-[17rem] z-50 drop-shadow-xl h-[8rem] bg-white rounded-xl absolute bottom-10 items-center justify-center right-4 gap-y-2  ${
          showCandidate ? "translate-y-[0rem]" : "translate-y-[12rem]"
        } transition duration-[200ms] ease-in-out delay-[100ms] z-40 flex-col flex p-3`}
      >
        <p className="text-black  text-sm ">somebody want to join the meet </p>
        {/* User */}
        <div className="h-[2rem] flex  gap-x-2 items-center  w-full ">
          <Avatar radius="xl" src={apiUrl + candidate.photoUrl} size={30} />
          <p className="text-black  text-sm ">{candidate.fullname} </p>
        </div>
        {/* Bttuon */}
        <div className="flex items-center gap-x-3">
          <Button
            onClick={() => answerCandidature("accept")}
            className="text-blue-400 hover:bg-white"
          >
            accepter
          </Button>
          <Button
            onClick={() => answerCandidature("refuse")}
            className="text-blue-400 hover:bg-white"
          >
            refuser
          </Button>
        </div>
      </div>

      {/* Left Notification */}
      <div
        className={`w-[23rem] h-[3rem] bg-black rounded-xl absolute bottom-10 gap-x-2 items-center px-2  justify-center left-4 gap-y-2  ${
          ShowLeftParticipant ? "translate-y-[0rem]" : "translate-y-[12rem]"
        } transition duration-[200ms] ease-in-out delay-[100ms] z-40  flex p-3`}
      >
        {/* User */}

        <p className="text-white   "> {LeftParticipant.fullname} </p>

        <p className="text-white">left </p>
      </div>
      {/* drawer */}
      <Drawer position="right" opened={opened} onClose={close}>
        <Tabs defaultValue="messages">
          <Tabs.List>
            <Tabs.Tab value="task" icon={<BsListTask size="0.8rem" />}>
              Task
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

          <Tabs.Panel value="task" pt="xs">
            <div className="h-[85vh] pt-4">
              <Stepper
                active={active}
                onStepClick={setActive}
                orientation="vertical"
              >
                <Stepper.Step label="Step 1" description="Create an account" />
                <Stepper.Step label="Step 2" description="Verify email" />
                <Stepper.Step label="Step 3" description="Get full access" />
                <Stepper.Step label="Step 3" description="Get full access" />
              </Stepper>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="messages" pt="xs">
            <div className=" flex flex-col h-[85vh] ">
              <ul className="flex-1 flex-col overflow-y-scroll  gap-y-4 flex  list-none">
                {Messages.map((message: Message) => {
                  if (message.type === "file") {
                    return (
                      <li
                        key="file-item"
                        className={`min-h-[3rem] p-3  flex-col ${
                          message.fullname === userRef?.current?.fullname
                            ? "self-end"
                            : "self-start"
                        }  cursor-pointer max-w-[80%] flex px-2 items-center `}
                      >
                        <p
                          className={`${
                            message.fullname === userRef?.current?.fullname
                              ? "self-end"
                              : "self-start"
                          } font-semibold `}
                        >
                          {message.fullname === userRef?.current?.fullname
                            ? "vous"
                            : message.fullname}
                        </p>
                        <div
                          className={`flex-1 flex rounded-lg p-3 ${
                            message.senderId === userRef?.current?._id
                              ? "  self-end bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        >
                          {" "}
                          <img
                            src={
                              MapType.has(`${message.fileType.split("/")[1]}`)
                                ? MapType.get(
                                    `${message.fileType.split("/")[1]}`
                                  )
                                : MapType.get("unknown")
                            }
                            className={`h-8 w-8`}
                          />
                          <Link
                            target="_blank"
                            className={
                              message.senderId === userRef?.current?._id
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
                  } else {
                    return (
                      <li
                        key={message.messageId}
                        className={`min-h-[4rem] ${
                          message.senderId === userRef?.current?._id
                            ? "self-end"
                            : ""
                        }  max-w-[70%] px-4 gap-x-3 flex-col flex`}
                      >
                        <p className="font-semibold self-end">
                          {message.fullname === userRef?.current?.fullname
                            ? "vous"
                            : message.fullname}
                        </p>
                        <div
                          className={`flex-1 h-auto flex flex-col p-4 rounded-lg ${
                            message.senderId === userRef?.current?._id
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        >
                          <p
                            className={
                              message.senderId === userRef?.current?._id
                                ? "text-white"
                                : "text-black"
                            }
                          >
                            {message.content}
                          </p>
                          <p
                            className={
                              message.senderId === userRef?.current?._id
                                ? "text-white text-sm self-end"
                                : "text-sm self-end text-black"
                            }
                          >
                            {
                              <TimeAgo
                                locale="fr"
                                datetime={message.createdTime}
                              />
                            }
                          </p>
                        </div>
                      </li>
                    );
                  }
                })}
              </ul>
              {emojiStatus && (
                <div className="absolute bottom-20 right-2 ">
                  <EmojiPicker onEmojiClick={EmojiPickerHandler} />
                </div>
              )}
              <div className="h-[4rem] p-4 flex items-center w-full gap-x-2 border-t-2">
                <AiOutlinePaperClip
                  onClick={() => FileInput?.current?.click()}
                  className="cursor-pointer"
                  size={24}
                />
                <Input
                  rightSection={
                    <BsEmojiSmile
                      onClick={() => setEmojiStatus(!emojiStatus)}
                      size={24}
                      color={emojiStatus ? "#1877f2" : "#000"}
                      className={`mr-3 cursor-pointer text-current ${
                        emojiStatus ? "text-blue-400" : "text-black"
                      } `}
                    />
                  }
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setMessageContent(e.currentTarget.value)
                  }
                  placeholder="entrez votre message"
                  className="bg-red-100 flex-1"
                  size="md"
                  value={Message}
                />
                <Button
                  onClick={() => sendMessage()}
                  className="bg-blue-700 hover:bg-blue-900 p-2"
                >
                  <FaPaperPlane size={20} color="white" />{" "}
                </Button>
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="participants" pt="xs">
            <ul className="flex-1 h-[80vh] list-none">
              {Room.participants.map(
                (participant: Participant, indx: number) => (
                  <li
                    key={indx.toString()}
                    className="h-[4rem]  px-4 gap-x-3  flex items-center"
                  >
                    <Avatar
                      src={apiUrl + participant.photoUrl}
                      radius={30}
                      size={50}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {userRef?.current?.fullname === participant.fullname
                          ? "Vous"
                          : participant.fullname}{" "}
                        {participant._id === Room.adminId
                          ? `(organisateur)`
                          : ""}
                      </p>
                      <p className="text-gray-400">{participant.email}</p>
                    </div>
                    <div className="bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full">
                      <BiMicrophoneOff
                        color="white"
                        className="cursor-pointer"
                      />
                    </div>
                  </li>
                )
              )}
            </ul>
          </Tabs.Panel>
        </Tabs>
      </Drawer>
      {/* Date */}
      <h2 className="text-gray-400">{formatDate(Room.startDate)}</h2>
      {/* Title and Time */}
      <div className="h-[3rem] w-full flex items-center justify-between">
        <div className="flex gap-x-3 items-center">
          <p className="text-xl font-semibold">{Room.roomName}</p>
          {/* button to Modify */}
          {userRef.current?._id === Room.adminId && (
            <div
              onClick={() => setOpenedTitleModal(true)}
              className="cursor-pointer flex items-center justify-center h-8 w-8 bg-gray-200 hover:bg-gray-400 rounded-full"
            >
              <FaPen size={15} />
            </div>
          )}
        </div>
        <div className="h-[2.3rem] bg-white w-[8rem] drop-shadow-md border justify-center flex items-center  rounded-full">
          <p className="text-lg text-gray-400 font-semibold tracking-wider">
            {timeInMeeting}
          </p>
        </div>
      </div>
      {/* participants */}
      <LiveKitRoom
        token={liveKitToken}
        serverUrl={SERVER_LIVEKIT_URL}
        video={true}
        audio={true}
        // Use the default LiveKit theme for nice styles.
        data-lk-theme="default"
        style={{ height: "80vh" }}
      >
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference handRaiseIds={handRaiseIds} />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen
      share tracks and to leave the room. */}
        {/* Option */}
        <div className="h-[3.5rem] w-full  flex items-center justify-between">
          <div className="h-[2.3rem] bg-white p-2  w-[12rem] gap-x-3 border-[0.09rem]  border-gray-400 justify-center flex items-center  rounded-md">
            <p className="text-base text-gray-400 tracking-wider">
              {params.roomId}
            </p>
            <div className="h-full w-[0.1rem] bg-gray-200"></div>
            <CopyButton
              value={`${frontendUrl}?r=${params.roomId}`}
              timeout={2000}
            >
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

          {/* The Main Feature */}
          <div className="h-auto  p-2  min-w-[12rem] gap-x-6 relative  border-gray-400 justify-center flex items-center  rounded-md">
            {/* Controls for media */}
            <ControlBar
              controls={{
                leave: false,
              }}
              variation="minimal"
            />
            {/* Emoji */}
            <div className="relative">
              {emojiReactionPicker ? (
                <div className="h-18 absolute z-50 p-3 bottom-14 left-auto rounded-full bg-white flex gap-x-4">
                  {emojisReactions.map((emoji) => (
                    <div
                      onClick={() => pickEmoji(emoji.image)}
                      className="cursor-pointer flex items-center justify-center h-8 w-8 bg-gray-200 hover:bg-gray-400 rounded-full"
                    >
                      {emoji.image}
                    </div>
                  ))}
                </div>
              ) : (
                ""
              )}
              <div
                onClick={() => setEmojiReactionPicker(!emojiReactionPicker)}
                className={` ${
                  emojiReactionPicker ? "bg-black" : "bg-white"
                } shadow-sm  border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md`}
              >
                <BsEmojiSmile
                  size={14}
                  color={emojiReactionPicker ? "white" : "gray"}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Message */}
            <div
              onClick={() =>
                handRaiseIds.includes(
                  userRef?.current?.fullname.replace(/\s/g, "_")
                )
                  ? putHandDown()
                  : handRaise()
              }
              className={`${
                handRaiseIds.includes(
                  userRef?.current?.fullname.replace(/\s/g, "_")
                )
                  ? "bg-black"
                  : "bg-white"
              }  shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md`}
            >
              <PiHandFill
                color={
                  handRaiseIds.includes(
                    userRef?.current?.fullname.replace(/\s/g, "_")
                  )
                    ? "white"
                    : "gray"
                }
                className="cursor-pointer"
              />
            </div>
            {/* dots */}
            <div
              onClick={open}
              className="bg-white   relative shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md"
            >
              <BiDotsHorizontalRounded
                color="gray"
                className="cursor-pointer"
              />
            </div>
          </div>
          {/* Leave the meet */}
          <Button
            onClick={() => LeftMeeting()}
            className="bg-red-500 hover:bg-red-700"
          >
            Leave meet
          </Button>
        </div>
      </LiveKitRoom>

      {/* Display emoji reactions */}
      {renderEmojiReactions()}
    </div>
  );
}

export default RoomScreen;
