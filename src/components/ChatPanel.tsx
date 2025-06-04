import React, { useState, useRef, FormEvent } from 'react';
import { Input, Button, Tooltip } from '@mantine/core';
import { BsEmojiSmile } from 'react-icons/bs';
import { AiOutlinePaperClip } from 'react-icons/ai';
import { FaPaperPlane } from 'react-icons/fa';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Link } from 'react-router-dom';
import TimeAgo from 'timeago-react';
import { Socket } from 'socket.io-client';
import { AxiosInstance } from 'axios'; // Assuming httpClient is an AxiosInstance
import { notifications } from '@mantine/notifications';

// Assuming these types are defined in a shared location or can be moved/redefined here
import { MapType } from '../utils/File'; // Import MapType

// For now, let's define them locally for ChatPanel to be self-contained initially.
// Later, these could be imported from a central types file.
// These types are also defined in RoomScreen.tsx, consider moving to a shared types file.
interface StoredParticipantData {
  _id: string;
  fullname: string;
}

interface Message {
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

// Local MapType placeholder removed, will use imported one.

export interface ChatPanelProps {
  socket: Socket;
  currentRoomId: string;
  currentUser: StoredParticipantData | null;
  messages: Message[];
  apiUrl: string;
  httpClient: AxiosInstance; // If using axios for httpClient
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  socket,
  currentRoomId,
  currentUser,
  messages,
  apiUrl,
  httpClient,
}) => {
  const [messageContent, setMessageContent] = useState("");
  const [emojiStatus, setEmojiStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojiPickerHandler = (emojiData: EmojiClickData) => {
    setMessageContent((prevContent) => prevContent + emojiData.emoji);
  };

  const sendMessage = () => {
    if (!messageContent.trim()) return; // Don't send empty messages

    const newMessage: Message = {
      fullname: currentUser?.fullname || "Unknown User",
      senderId: currentUser?._id || "unknown-id",
      createdTime: new Date().toISOString(),
      content: messageContent,
      messageId: Math.random().toString(), // Consider a more robust ID generation if needed
      type: "text",
    };
    socket.emit("sendMessage", {
      message: newMessage,
      roomId: currentRoomId,
    });
    setMessageContent("");
    setEmojiStatus(false); // Close emoji picker after sending
  };

  const fileHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("roomId", currentRoomId);
      formData.append("senderId", currentUser?._id || "unknown-id");
      formData.append("fullname", currentUser?.fullname || "Unknown User");

      // This emits a socket event 'sendFile' which the server should handle
      // to then broadcast a 'receiveMessage' of type 'file'.
      // The actual file upload happens via httpClient, but the message about the file is via socket.

      // Perform the upload
      const response = await httpClient.post("/auth/document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Assuming server returns { name: string, url: string, fileType: string } in response.data
      // after successful upload and processing.
      // This part might need adjustment based on actual server response for /auth/document
      if (response.data && response.data.url) {
         const fileMessage: Message = {
            fullname: currentUser?.fullname || "Unknown User",
            senderId: currentUser?._id || "unknown-id",
            createdTime: new Date().toISOString(),
            content: "", // No text content for file messages typically
            messageId: Math.random().toString(),
            type: "file",
            name: file.name, // Use original file name
            url: response.data.url, // URL from server
            fileType: file.type, // Original file type
        };
        socket.emit("sendMessage", { // Use the same 'sendMessage' event
            message: fileMessage,
            roomId: currentRoomId,
        });
        notifications.show({
            title: "File Uploaded",
            color: "green",
            message: `${file.name} sent successfully.`,
        });
      } else {
        throw new Error("File upload did not return a URL.");
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      notifications.show({
        title: "File Upload Failed",
        color: "red",
        message: `Could not upload ${file.name}.`,
      });
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-[85vh]">
      <ul className="flex-1 flex-col overflow-y-scroll gap-y-4 flex list-none p-4">
        {messages.map((message) => {
          const isCurrentUserMessage = message.senderId === currentUser?._id;
          if (message.type === "file") {
            return (
              <li
                key={message.messageId}
                className={`min-h-[3rem] p-3 flex-col ${
                  isCurrentUserMessage ? "self-end" : "self-start"
                } cursor-pointer max-w-[80%] flex px-2 items-center `}
              >
                <p
                  className={`${
                    isCurrentUserMessage ? "self-end" : "self-start"
                  } font-semibold `}
                >
                  {isCurrentUserMessage ? "You" : message.fullname}
                </p>
                <div
                  className={`flex items-center rounded-lg p-3 ${
                    isCurrentUserMessage ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                  }`}
                >
                  <img
                    src={
                      message.fileType && MapType.has(message.fileType.split("/")[1])
                        ? MapType.get(message.fileType.split("/")[1])
                        : MapType.get("unknown")
                    }
                    className="h-8 w-8 mr-2"
                    alt={message.name || "file icon"}
                  />
                  <Link
                    target="_blank"
                    to={apiUrl + message.url} // Assuming URL might not have apiUrl prefix yet
                    className={isCurrentUserMessage ? "text-white hover:underline" : "text-black hover:underline"}
                  >
                    {message.name || "Untitled File"}
                  </Link>
                </div>
                 <p className={`text-xs ${isCurrentUserMessage ? "self-end" : "self-start"} text-gray-500 mt-1`}>
                    <TimeAgo locale="fr" datetime={message.createdTime} />
                </p>
              </li>
            );
          } else {
            return (
              <li
                key={message.messageId}
                className={`min-h-[4rem] ${
                  isCurrentUserMessage ? "self-end" : "self-start"
                } max-w-[70%] px-4 gap-x-3 flex-col flex`}
              >
                <p className={`font-semibold ${isCurrentUserMessage ? "self-end" : "self-start"}`}>
                  {isCurrentUserMessage ? "You" : message.fullname}
                </p>
                <div
                  className={`flex-1 h-auto flex flex-col p-3 rounded-lg ${
                    isCurrentUserMessage ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs ${isCurrentUserMessage ? "self-end text-gray-200" : "self-end text-gray-500"} mt-1`}>
                    <TimeAgo locale="fr" datetime={message.createdTime} />
                  </p>
                </div>
              </li>
            );
          }
        })}
      </ul>
      {emojiStatus && (
        <div className="absolute bottom-20 right-2 z-10"> {/* Ensure EmojiPicker is above input */}
          <EmojiPicker onEmojiClick={emojiPickerHandler} />
        </div>
      )}
      <div className="h-[4rem] p-4 flex items-center w-full gap-x-2 border-t-2">
        <Tooltip label="Attach file">
          <AiOutlinePaperClip
            onClick={() => fileInputRef?.current?.click()}
            className="cursor-pointer"
            size={24}
          />
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={fileHandler}
        />
        <Input
          rightSection={
            <Tooltip label={emojiStatus ? "Close emojis" : "Open emojis"}>
              <BsEmojiSmile
                onClick={() => setEmojiStatus(!emojiStatus)}
                size={24}
                color={emojiStatus ? "#1877f2" : undefined}
                className="mr-3 cursor-pointer"
              />
            </Tooltip>
          }
          onChange={(e: FormEvent<HTMLInputElement>) =>
            setMessageContent(e.currentTarget.value)
          }
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Type your message..."
          className="flex-1"
          size="md"
          value={messageContent}
        />
        <Button
          onClick={sendMessage}
          className="bg-blue-700 hover:bg-blue-900 p-2"
          disabled={!messageContent.trim()}
        >
          <FaPaperPlane size={20} color="white" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
