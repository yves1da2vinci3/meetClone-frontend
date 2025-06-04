import React from 'react';
import { Avatar } from '@mantine/core';
import { BiMicrophoneOff } from 'react-icons/bi'; // Assuming this icon is for display purposes

// Define Participant type (should match the one in RoomScreen.tsx or be imported from a shared types file)
export interface Participant {
  _id: string;
  fullname: string;
  email?: string;
  photoUrl?: string;
}

export interface ParticipantListPanelProps {
  participants: Participant[];
  currentUserId?: string;
  adminId?: string;
  apiUrl: string;
}

const ParticipantListPanel: React.FC<ParticipantListPanelProps> = ({
  participants,
  currentUserId,
  adminId,
  apiUrl,
}) => {
  return (
    <ul className="flex-1 h-[80vh] list-none overflow-y-auto">
      {participants.map((participant) => (
        <li
          key={participant._id}
          className="h-[4rem] px-4 gap-x-3 flex items-center border-b border-gray-200 last:border-b-0"
        >
          <Avatar
            src={participant.photoUrl ? `${apiUrl}${participant.photoUrl}` : undefined}
            alt={participant.fullname}
            radius={30}
            size={40} // Adjusted size slightly for better fit, can be prop later
          />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {currentUserId === participant._id ? "You" : participant.fullname}
              {participant._id === adminId ? <span className="text-xs text-gray-500 ml-1">(Organizer)</span> : ""}
            </p>
            {participant.email && <p className="text-gray-500 text-xs">{participant.email}</p>}
          </div>
          <div className="bg-gray-200 hover:bg-gray-300 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full">
            {/*
              TODO: Implement actual mute status and control if needed.
              For now, it's a placeholder icon.
            */}
            <BiMicrophoneOff
              color="gray"
              className="cursor-pointer"
              size={18}
            />
          </div>
        </li>
      ))}
      {participants.length === 0 && (
        <li className="text-center text-gray-500 py-4">No participants yet.</li>
      )}
    </ul>
  );
};

export default ParticipantListPanel;
