import React from 'react'
import { BiMicrophoneOff } from 'react-icons/bi'
import { PiHandFill } from 'react-icons/pi'
import { apiUrl } from '../config/ApiUrl'


interface MeetGridProps {
    index: number
    participant : any
    peer? :any
    handRaiseIds : string[]
    userRef :any
    userVideoRef :any
}

function MeetGrid({index,participant,peer,handRaiseIds,userRef,userVideoRef}:MeetGridProps) {
  return (
    <div key={index.toString()} className=' items-center flex justify-center  rounded-lg  border-2 relative' >
          {/* {participant._id === userRef.current._id && <video ref={userVideoRef} />} */}
          {handRaiseIds.includes(participant._id) && <PiHandFill className='absolute top-6 right-6 ' color='#F7D7B5'  size={25}  /> }
         <img className='h-[5rem] w-[5rem] rounded-full' src={apiUrl+ participant.photoUrl} />
         <div className='absolute bottom-0 z-40  h-[3rem] items-center flex justify-between px-2  w-full' >
             <p className='text-white' >{participant.fullname === userRef.current.fullname ? "Vous" : participant.fullname }</p>
             <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
   <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

   </div>
         </div>
     </div>
  )
}

export default MeetGrid