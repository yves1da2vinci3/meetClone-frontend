import React from 'react'
import { BiMicrophoneOff } from 'react-icons/bi'
import { PiHandFill } from 'react-icons/pi'
import { apiUrl } from '../config/ApiUrl'


interface MeetParticipant {
  _id: string;
  photoUrl?: string; // Made optional as it might not always be present
  fullname: string;
}

interface MeetGridProps {
    index: number;
    participant : MeetParticipant;
    handRaiseIds : string[];
    userRef : React.RefObject<MeetParticipant | null>; // Assuming userRef.current can be null or a MeetParticipant
    userVideoRef : React.RefObject<HTMLVideoElement>;
}

function MeetGrid({index, participant, handRaiseIds, userRef, userVideoRef}: MeetGridProps) {
  // Ensure userRef and userRef.current are not null before accessing properties
  if (userRef.current && participant._id === userRef.current._id) {
    return <video ref={userVideoRef} autoPlay playsInline className="w-full h-full object-cover" />;
  }
  return (
    <div key={index.toString()} className='bg-gray-700 items-center flex justify-center rounded-lg border-2 border-gray-600 relative overflow-hidden'>
          {handRaiseIds.includes(participant._id) && <PiHandFill className='absolute top-2 right-2 text-yellow-300' size={20} />}
         <img className='h-20 w-20 rounded-full object-cover' src={participant.photoUrl ? apiUrl + participant.photoUrl : undefined} alt={participant.fullname} />
         <div className='absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 h-10 items-center flex justify-between px-2 w-full'>
             <p className='text-white text-sm font-medium truncate'>{userRef.current && participant.fullname === userRef.current.fullname ? "Vous" : participant.fullname }</p>
             <div className='bg-blue-600 h-7 w-7 cursor-pointer flex items-center justify-center rounded-full'>
   <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

   </div>
         </div>
     </div>
  )
}

export default MeetGrid