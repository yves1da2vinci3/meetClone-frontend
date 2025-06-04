import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import joinSFX from "../sounds/join.mp3"; // Assuming paths are correct relative to this new file
import msgSFX from "../sounds/message.mp3";
import leaveSFX from "../sounds/leave.mp3";

// --- Replicated Interfaces (Ideally, import from a shared types file) ---
export interface StoredParticipantData {
  _id: string;
  fullname: string;
  // Add other fields from Participant if currentUser is expected to have them
  photoUrl?: string;
  email?: string;
}

export interface Participant {
  _id: string;
  fullname: string;
  email?: string;
  photoUrl?: string;
}

export interface RoomInfo {
  adminId: string;
  participants: Participant[];
  roomName: string;
  startDate: Date;
}

export interface CandidateInfo {
  _id?: string;
  photoUrl?: string;
  fullname: string;
}

export interface LeftParticipantInfo {
  fullname: string;
}

export interface EmojiReaction {
  emojiId: string;
  done: boolean;
  userId: string;
  image: string;
  roomId: string;
}

export interface Message {
  type?: "file" | "text";
  name?: string;
  url?: string;
  fullname: string;
  senderId: string;
  createdTime: string;
  content: string;
  messageId: string;
  fileType?: string;
}
// --- End Replicated Interfaces ---

export interface UseRoomSocketEventsOptions {
  socket: Socket | null;
  roomId?: string; // roomId from useParams can be undefined initially
  currentUser: StoredParticipantData | null;
  onNewMessage: (message: Message) => void; // Callback to RoomScreen to update its messages state
}

export const useRoomSocketEvents = ({
  socket,
  roomId,
  currentUser,
  onNewMessage,
}: UseRoomSocketEventsOptions) => {
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [leftParticipantInfo, setLeftParticipantInfo] = useState<LeftParticipantInfo | null>(null);
  const [showLeftParticipantNotification, setShowLeftParticipantNotification] = useState(false);
  const [handRaiseIds, setHandRaiseIds] = useState<string[]>([]);
  const [emojiReactionsMark, setEmojiReactionsMark] = useState<EmojiReaction[]>([]);

  const joinAudioRef = useRef(new Audio(joinSFX));
  const msgAudioRef = useRef(new Audio(msgSFX));
  const leaveAudioRef = useRef(new Audio(leaveSFX));

  // To prevent adding duplicate emojis if events fire rapidly or are duplicated
  const uniqueEmojisIds = useRef(new Set<string>());


  // Placeholder for event listeners and emitters - to be implemented in Phase 2 & 3
  useEffect(() => {
    if (!socket || !roomId || !currentUser) {
      // Reset state if essential connection parameters are missing
      setCurrentRoom(null);
      setLiveKitToken(null);
      setCandidateInfo(null);
      setShowCandidateModal(false);
      // ... reset other states
      return;
    }

    // Define handlers
    const handleGetRoom = (data: { room: RoomInfo }) => {
      setCurrentRoom(data.room);
    };

    const handleLiveKitToken = (data: { token: string; userId: string; roomId: string }) => {
      if (data.roomId === roomId) { // Use roomId from hook args
        if (data.userId === currentUser?._id) {
          setLiveKitToken(data.token);
        }
      }
    };

    const handleSomebodyWantToJoinRoom = (data: { roomId: string; adminId: string; user: CandidateInfo }) => {
      if (data.roomId === roomId) {
        if (currentUser?._id === data.adminId) {
          setCandidateInfo(data.user);
          setShowCandidateModal(true);
        }
      }
    };

    const handleSomebodyJoined = (data: { roomId: string; room: RoomInfo }) => {
      if (data.roomId === roomId) {
        setCurrentRoom(data.room);
        joinAudioRef.current.play().catch(err => console.error("Error playing join sound:", err));
      }
    };

    const handleReceiveMessage = (data: { roomId: string; message: Message }) => {
      if (data.roomId === roomId) {
        onNewMessage(data.message); // Call callback passed from RoomScreen
        // msgAudioRef.current.play().catch(err => console.error("Error playing message sound:", err));
        // Temporarily disable msg sound due to potential duplicate plays if RoomScreen also plays it.
        // Decision: RoomScreen will be responsible for playing msgAudio if it's managing uniqueMessageIds.
        // If uniqueMessageIds moves to the hook, then this hook plays it.
        // For now, let RoomScreen handle it as it checks uniqueMessageIds.
      }
    };

    const handleLeftMeeting = (data: { roomId: string; participant: LeftParticipantInfo; room: RoomInfo }) => {
      if (data.roomId === roomId) {
        setLeftParticipantInfo(data.participant);
        setCurrentRoom(data.room);
        setShowLeftParticipantNotification(true);
        leaveAudioRef.current.play().catch(err => console.error("Error playing leave sound:", err));
        setTimeout(() => {
          setShowLeftParticipantNotification(false);
        }, 3000);
      }
    };

    const handleRaiseHand = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        setHandRaiseIds((prevHandRaiseIds) => {
          if (!prevHandRaiseIds.includes(data.userId)) {
            return [...prevHandRaiseIds, data.userId];
          }
          return prevHandRaiseIds;
        });
      }
    };

    const handlePutHandDown = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        setHandRaiseIds((prevHandRaiseIds) =>
          prevHandRaiseIds.filter((id) => id !== data.userId)
        );
      }
    };

    const handleUpdateTitle = (data: { roomId: string; title: string; room: RoomInfo }) => {
      if (data.roomId === roomId) {
        setCurrentRoom(data.room); // Assuming server sends back the updated room object
      }
    };

    const handleEmojiReaction = (data: EmojiReaction) => {
      if (data.roomId === roomId && !uniqueEmojisIds.current.has(data.emojiId)) {
        setEmojiReactionsMark((prevState) => [...prevState, data]);
        uniqueEmojisIds.current.add(data.emojiId);
      }
    };

    // Emit initial events
    socket.emit("getRoom", { roomId });
    socket.emit("getLiveKitToken", { roomId, user: currentUser });

    // Register event listeners
    socket.on("getRoom", handleGetRoom);
    socket.on("liveKitToken", handleLiveKitToken);
    socket.on("somebodyWantToJoinRoom", handleSomebodyWantToJoinRoom);
    socket.on("somebodyJoined", handleSomebodyJoined);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("leftMeeting", handleLeftMeeting);
    socket.on("raiseHand", handleRaiseHand);
    socket.on("putHandDown", handlePutHandDown);
    socket.on("updateTitle", handleUpdateTitle);
    socket.on("emojiReaction", handleEmojiReaction);

    // Cleanup function
    return () => {
      socket.off("getRoom", handleGetRoom);
      socket.off("liveKitToken", handleLiveKitToken);
      socket.off("somebodyWantToJoinRoom", handleSomebodyWantToJoinRoom);
      socket.off("somebodyJoined", handleSomebodyJoined);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("leftMeeting", handleLeftMeeting);
      socket.off("raiseHand", handleRaiseHand);
      socket.off("putHandDown", handlePutHandDown);
      socket.off("updateTitle", handleUpdateTitle);
      socket.off("emojiReaction", handleEmojiReaction);
      uniqueEmojisIds.current.clear(); // Clear the set on cleanup
    };
  }, [socket, roomId, currentUser, onNewMessage]); // Dependencies for the main effect

  const acceptOrRejectCandidate = useCallback((accept: boolean) => {
    if (socket && roomId && candidateInfo && candidateInfo._id) { // Ensure candidateInfo and its _id is present
      socket.emit("AnwserToCandidature", {
        answer: accept,
        roomId: roomId,
        // Server expects 'user' to have at least an _id for identification
        user: { _id: candidateInfo._id, fullname: candidateInfo.fullname, photoUrl: candidateInfo.photoUrl },
      });
      setShowCandidateModal(false);
      setCandidateInfo(null);
    }
  }, [socket, roomId, candidateInfo]);

  const leaveRoom = useCallback(() => {
    if (socket && roomId && currentUser) {
      socket.emit("leftMeeting", { // Event name from RoomScreen
        roomId: roomId,
        user: currentUser,
      });
      // Navigation will be handled by RoomScreen after this emit, or via a callback
    }
  }, [socket, roomId, currentUser]);

  const submitNewTitle = useCallback((newTitle: string) => {
    if (socket && roomId && newTitle.trim()) {
      socket.emit("updateTitle", { // Event name from RoomScreen
        roomId: roomId,
        title: newTitle.trim(),
      });
    }
  }, [socket, roomId]);

  const sendEmojiReaction = useCallback((emojiImage: string) => {
    if (socket && roomId && currentUser) {
      const reaction: EmojiReaction = {
        userId: currentUser._id,
        image: emojiImage,
        done: false, // Assuming 'done' is for some animation tracking, server might not need it
        roomId: roomId,
        emojiId: Math.random().toString(), // Client-side ID for local rendering uniqueness if needed
      };
      socket.emit("emojiReaction", reaction); // Event name from RoomScreen
    }
  }, [socket, roomId, currentUser]);

  const emitRaiseHand = useCallback(() => {
    if (socket && roomId && currentUser?._id) {
      socket.emit("raiseHand", {
        roomId: roomId,
        userId: currentUser._id,
      });
    }
  }, [socket, roomId, currentUser]);

  const emitPutHandDown = useCallback(() => {
    if (socket && roomId && currentUser?._id) {
      socket.emit("putHandDown", {
        roomId: roomId,
        userId: currentUser._id,
      });
    }
  }, [socket, roomId, currentUser]);


  const closeCandidateModal = () => {
    setShowCandidateModal(false);
    setCandidateInfo(null);
  }

  return {
    currentRoom,
    liveKitToken,
    candidateInfo,
    showCandidateModal,
    closeCandidateModal, // For RoomScreen to close modal if needed (e.g. on admin action elsewhere)
    acceptOrRejectCandidate,
    leftParticipantInfo,
    showLeftParticipantNotification,
    handRaiseIds,
    // setHandRaiseIds, // Internal to the hook, updated by socket events
    emojiReactionsMark,
    // Emitter functions
    leaveRoom,
    submitNewTitle,
    sendEmojiReaction,
    emitRaiseHand,
    emitPutHandDown,
    // Audio refs are not returned as they are side effects within handlers
  };
};
