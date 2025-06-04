import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  CopyButton,
  Drawer,
  // Input, // No longer directly used, ChatPanel has its own
  // Menu, // Seems unused
  Stack,
  Stepper,
  Tabs,
  TextInput,
  Tooltip,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  BiDotsHorizontalRounded,
  BiMessageDetail,
} from "react-icons/bi";
import {
  BsFillPeopleFill,
  BsListTask,
  BsEmojiSmile,
} from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";
import { FaPen, FaUpload } from "react-icons/fa";
import { PiHandFill } from "react-icons/pi";
import { useNavigate, useParams } from "react-router-dom";
import httpClient, { apiUrl, frontendUrl } from "../config/ApiUrl";
import * as timeago from "timeago.js"; // Keep for timeago.register
import fr from "timeago.js/lib/lang/fr"; // Keep for timeago.register

// import { notifications } from "@mantine/notifications"; // Not used directly by RoomScreen
import calculateGridTemplateAreas from "../utils/CalculateTemplateAreas";

import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Socket } from "socket.io-client";

// Types are now primarily from the hook or shared types
import {
  useRoomSocketEvents,
  StoredParticipantData, // Still needed for userRef
  // RoomInfo, // Provided by hook
  // CandidateInfo, // Provided by hook
  // LeftParticipantInfo, // Provided by hook
  EmojiReaction, // Provided by hook (for emojiReactionsMark prop type if needed, or internal to hook)
  Message,      // Still needed for messages state
  // Participant // Provided by RoomInfo from hook
} from '../hooks/useRoomSocketEvents';

import msgSFX from "../sounds/message.mp3";
// joinSFX and leaveSFX are in the hook
import MyvideoConference from "../components/MyvideoConference";
import ChatPanel from '../components/ChatPanel';
import ParticipantListPanel from '../components/ParticipantListPanel';
import formatDate, { formatTime } from "../utils/formatDate"; // Keep
import emojisReactions from "../utils/emojiReaction"; // For emoji picker options display

timeago.register("fr", fr);

interface RoomProps {
  socket: Socket;
}

function RoomScreen({ socket }: RoomProps) {
  const msgAudio = useRef(new Audio(msgSFX));
  const navigate = useNavigate();
  const params = useParams<{ roomId: string }>(); // Ensure roomId is properly typed from params

  const [timeInMeeting, setTimeInMeeting] = useState<string>("");
  const localStorageData = localStorage.getItem("participant");
  const parsedData: StoredParticipantData | null = localStorageData
    ? JSON.parse(localStorageData)
    : null;
  const userRef = useRef<StoredParticipantData | null>(parsedData);

  const [messages, setMessages] = useState<Message[]>([]);
  const uniqueMessageIds = useRef(new Set<string>());

  const onNewMessageCallback = useCallback((message: Message) => {
    if (!uniqueMessageIds.current.has(message.messageId)) {
      setMessages((prevMessages) => [...prevMessages, message]);
      uniqueMessageIds.current.add(message.messageId);
      msgAudio.current.play().catch(err => console.error("Error playing message sound:", err));
    }
  }, []); // msgAudio is a ref, so it's stable

  const {
    currentRoom,
    liveKitToken,
    candidateInfo,
    showCandidateModal,
    // closeCandidateModal, // Not directly used by RoomScreen UI action, modal closes via accept/reject
    acceptOrRejectCandidate,
    leftParticipantInfo,
    showLeftParticipantNotification,
    handRaiseIds,
    emojiReactionsMark,
    leaveRoom,
    submitNewTitle,
    sendEmojiReaction,
    emitRaiseHand,
    emitPutHandDown,
  } = useRoomSocketEvents({
    socket,
    roomId: params.roomId,
    currentUser: userRef.current,
    onNewMessage: onNewMessageCallback,
  });

  const [openedDrawer, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [activeTabInDrawer, setActiveTabInDrawer] = useState(1); // For Stepper in Drawer (Task tab)

  const handleAcceptCandidature = () => {
    acceptOrRejectCandidate(true);
  };

  const handleRejectCandidature = () => {
    acceptOrRejectCandidate(false);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate("/");
  };

  const [gridStyle, setGridStyle] = useState({});
  useEffect(() => {
    if (currentRoom && currentRoom.participants) {
      const gridTemplateAreas = calculateGridTemplateAreas(
        currentRoom.participants.length
      );
      setGridStyle({ gridTemplateAreas });
    } else {
      setGridStyle(calculateGridTemplateAreas(0)); // Default for no participants
    }
  }, [currentRoom]);

  useEffect(() => {
    if (currentRoom?.startDate) {
      const intervalId = setInterval(() => {
        const newTime = formatTime(new Date(currentRoom.startDate));
        setTimeInMeeting(newTime);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [currentRoom?.startDate]);

  const [openedTitleModal, setOpenedTitleModal] = useState(false);
  const [newTitleLocal, setNewTitleLocal] = useState("");

  const handleUpdateTitle = () => {
    if (newTitleLocal.trim()) {
      submitNewTitle(newTitleLocal.trim());
    }
    setOpenedTitleModal(false);
    setNewTitleLocal("");
  };

  const [emojiReactionPicker, setEmojiReactionPicker] = useState(false);

  const getUserNameByUserId = (userId: string): string => {
    const user = currentRoom?.participants.find(
      (participant) => participant._id === userId
    );
    if (user) {
      return userRef.current?._id === userId ? "You" : user.fullname;
    } else {
      if (candidateInfo && candidateInfo._id === userId) return candidateInfo.fullname;
      return "Unknown User";
    }
  };

  const renderEmojiReactions = () => {
    return emojiReactionsMark.map((em, index) => (
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
    ));
  };

  const SERVER_LIVEKIT_URL = useMemo(() => {
    return import.meta.env.VITE_LIVEKIT_HOST;
  }, []);

  // Unused fileInputRef and fileHandler removed.

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 relative">
      <Modal
        title="Change Meeting Title"
        centered
        opened={openedTitleModal}
        onClose={() => setOpenedTitleModal(false)}
      >
        <Stack>
          <TextInput
            data-autofocus
            value={newTitleLocal}
            onChange={(e) => setNewTitleLocal(e.target.value)}
            placeholder={currentRoom?.roomName || "Enter new title"}
            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateTitle();}}
          />
          <Button
            style={{ backgroundColor: "#1877f3" }}
            leftIcon={<FaUpload />}
            onClick={handleUpdateTitle}
            disabled={!newTitleLocal.trim()}
          >
            Save
          </Button>
        </Stack>
      </Modal>

      {/* Commented out input has been removed */}

      <div
        className={`w-[17rem] z-50 drop-shadow-xl h-auto bg-white rounded-xl absolute bottom-10 items-center justify-center right-4 gap-y-2  ${
          showCandidateModal && candidateInfo ? "translate-y-[0rem]" : "translate-y-[20rem]" // Adjusted for auto height
        } transition-transform duration-[200ms] ease-in-out delay-[100ms] flex-col flex p-3`}
      >
        {candidateInfo && (
          <>
            <p className="text-black text-sm font-medium">Incoming Join Request</p>
            <div className="h-[2rem] flex gap-x-2 items-center w-full mt-2">
              <Avatar radius="xl" src={candidateInfo.photoUrl ? `${apiUrl}${candidateInfo.photoUrl}` : undefined} size={30} />
              <p className="text-black text-sm truncate">{candidateInfo.fullname}</p>
            </div>
            <div className="flex items-center gap-x-3 mt-3">
              <Button onClick={handleAcceptCandidature} variant="outline" color="blue" size="xs">
                Accept
              </Button>
              <Button onClick={handleRejectCandidature} variant="outline" color="red" size="xs">
                Reject
              </Button>
            </div>
          </>
        )}
      </div>

      <div
        className={`w-auto max-w-[23rem] h-[3rem] bg-black bg-opacity-80 text-white rounded-xl absolute bottom-10 left-1/2 -translate-x-1/2 gap-x-2 items-center px-4 justify-center ${
          showLeftParticipantNotification && leftParticipantInfo ? "translate-y-[0rem]" : "translate-y-[12rem]"
        } transition-transform duration-[200ms] ease-in-out delay-[100ms] z-40 flex p-3`}
      >
        {leftParticipantInfo && <p className="font-medium truncate">{leftParticipantInfo.fullname}</p>}
        <p>left the meeting.</p>
      </div>

      <Drawer position="right" opened={openedDrawer} onClose={closeDrawer} title="Menu">
        <Tabs defaultValue="messages">
          <Tabs.List>
            <Tabs.Tab value="task" icon={<BsListTask size="0.8rem" />}>
              Tasks
            </Tabs.Tab>
            <Tabs.Tab value="messages" icon={<BiMessageDetail size="0.8rem" />}>
              Messages
            </Tabs.Tab>
            <Tabs.Tab
              value="participants"
              rightSection={
                <Badge
                  w={16} h={16} color="gray"
                  sx={{ pointerEvents: "none" }} variant="filled" size="xs" p={0}
                >
                  {currentRoom?.participants?.length || 0}
                </Badge>
              }
              icon={<BsFillPeopleFill size="0.8rem" />}
            >
              Participants
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="task" pt="xs">
            <div className="h-[85vh] pt-4">
              <Stepper active={activeTabInDrawer} onStepClick={setActiveTabInDrawer} orientation="vertical">
                <Stepper.Step label="Step 1" description="Create an account" />
                <Stepper.Step label="Step 2" description="Verify email" />
              </Stepper>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="messages" pt="xs">
            {params.roomId && userRef.current && httpClient && socket && (
              <ChatPanel
                socket={socket}
                currentRoomId={params.roomId}
                currentUser={userRef.current}
                messages={messages}
                apiUrl={apiUrl}
                httpClient={httpClient}
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="participants" pt="xs">
            <ParticipantListPanel
              participants={currentRoom?.participants || []}
              currentUserId={userRef.current?._id}
              adminId={currentRoom?.adminId}
              apiUrl={apiUrl}
            />
          </Tabs.Panel>
        </Tabs>
      </Drawer>

      <h2 className="text-gray-400 text-sm">
        {currentRoom?.startDate ? formatDate(new Date(currentRoom.startDate)) : 'Loading date...'}
      </h2>

      <div className="h-[3rem] w-full flex items-center justify-between my-2">
        <div className="flex gap-x-3 items-center">
          <p className="text-xl font-semibold truncate">{currentRoom?.roomName || "Loading Room..."}</p>
          {userRef.current?._id === currentRoom?.adminId && (
            <Tooltip label="Edit title">
              <ActionIcon onClick={() => setOpenedTitleModal(true)} variant="subtle">
                <FaPen size={15} />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
        <div className="h-[2.3rem] bg-white w-auto px-4 drop-shadow-md border justify-center flex items-center rounded-full">
          <p className="text-sm text-gray-500 font-medium tracking-wider">
            {timeInMeeting || "00:00"}
          </p>
        </div>
      </div>

      {liveKitToken && SERVER_LIVEKIT_URL ? (
        <LiveKitRoom
          token={liveKitToken}
          serverUrl={SERVER_LIVEKIT_URL}
          video={true}
          audio={true}
          data-lk-theme="default"
          style={{ flexGrow: 1, overflow: 'hidden' }} // Ensure LiveKitRoom takes available space
          onDisconnected={() => handleLeaveRoom()}
        >
          <MyvideoConference handRaiseIds={handRaiseIds || []} />
          <RoomAudioRenderer />
          <div className="h-[5rem] w-full flex items-center justify-between p-2 bg-gray-50 rounded-b-lg"> {/* Footer bar */}
            <div className="h-full flex items-center">
              <p className="text-xs text-gray-500 hidden sm:block">{params.roomId}</p>
              <CopyButton value={`${frontendUrl}?r=${params.roomId}`} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copied" : "Copy link"} withArrow position="top">
                    <ActionIcon color={copied ? "teal" : "gray"} onClick={copy} variant="subtle" ml="xs">
                      <IoCopyOutline size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </div>

            <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: true }} />

            <div className="h-full flex items-center gap-x-2">
              <Tooltip label={emojiReactionPicker ? "Close Emojis" : "React"}>
                <ActionIcon onClick={() => setEmojiReactionPicker(!emojiReactionPicker)} variant="outline" size="lg" radius="md">
                  <BsEmojiSmile size={18}/>
                </ActionIcon>
              </Tooltip>
              {emojiReactionPicker && (
                <div className="absolute z-10 bottom-full mb-2 right-0 md:left-auto md:right-auto bg-white p-2 rounded-lg shadow-lg flex gap-x-2">
                  {emojisReactions.map((emoji) => (
                    <ActionIcon key={emoji.name} onClick={() => { sendEmojiReaction(emoji.image); setEmojiReactionPicker(false);}} size="lg" radius="md" variant="subtle">
                      {emoji.image}
                    </ActionIcon>
                  ))}
                </div>
              )}
              <Tooltip label={userRef.current?._id && handRaiseIds.includes(userRef.current._id) ? "Lower Hand" : "Raise Hand"}>
                <ActionIcon
                  onClick={() => userRef.current?._id && handRaiseIds.includes(userRef.current._id) ? emitPutHandDown() : emitRaiseHand()}
                  variant={userRef.current?._id && handRaiseIds.includes(userRef.current._id) ? "filled" : "outline"}
                  color={userRef.current?._id && handRaiseIds.includes(userRef.current._id) ? "blue" : "gray"}
                  size="lg" radius="md"
                >
                  <PiHandFill size={18}/>
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Menu">
                <ActionIcon onClick={openDrawer} variant="outline" size="lg" radius="md">
                  <BiDotsHorizontalRounded size={18}/>
                </ActionIcon>
              </Tooltip>
              <Button onClick={handleLeaveRoom} color="red" radius="md">
                Leave
              </Button>
            </div>
          </div>
        </LiveKitRoom>
      ) : (
        <div className="flex-grow flex items-center justify-center text-gray-500">Connecting to room...</div>
      )}
      {renderEmojiReactions()}
    </div>
  );
}

export default RoomScreen;
