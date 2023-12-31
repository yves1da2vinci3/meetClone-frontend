import { ActionIcon, Avatar, Badge, Button, CopyButton, Drawer, Input, Menu, Stepper, Tabs, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { BiDotsHorizontalRounded, BiMessageDetail, BiMicrophoneOff, BiSmile, BiSolidVideo } from 'react-icons/bi'
import { BsEmojiSmile, BsFillPeopleFill, BsListTask, BsRecordBtn, BsSoundwave } from 'react-icons/bs'
import {IoCopyOutline} from 'react-icons/io5'
import {AiOutlinePaperClip} from 'react-icons/ai'
import { MdScreenShare } from 'react-icons/md'
import { FaPaperPlane } from 'react-icons/fa'
import { PiHandFill } from 'react-icons/pi'
import { Link, useNavigate, useParams } from 'react-router-dom'
import httpClient, { apiUrl, frontendUrl } from '../config/ApiUrl'
import TimeAgo from 'timeago-react'
import * as timeago from 'timeago.js';
import EmojiPicker from 'emoji-picker-react';
// import it first.
import fr from 'timeago.js/lib/lang/fr';
import { MapType } from '../utils/File'
import { notifications } from '@mantine/notifications'
import calculateRowsAndColumns from '../utils/CalculateRowsAndColums'
import calculateGridTemplateAreas from '../utils/CalculateTemplateAreas'

// register it.
timeago.register('fr', fr);

interface RoomProps {
  socket :any
}
interface Message {
  type ? :string
  name ? :string
  url ? :string
  fullname: string;
  senderId: string;
  createdTime: string;
  content: string;
  messageId: string;
  fileType :string;
}
interface Participant {
  email :string;
  photoUrl ? :string
  _id : string
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
  adminId : string;
  participants : any[]
}
import joinSFX from "../sounds/join.mp3";
import msgSFX from "../sounds/message.mp3";
import leaveSFX from "../sounds/leave.mp3";
import MeetGrid from '../components/MeetGrid'


function RoomScreen({socket}:RoomProps) {
  const joinAudio = useRef(new Audio(joinSFX))
  const msgAudio = useRef(new Audio(msgSFX))
  const leaveAudio = useRef(new Audio(leaveSFX))
const navigate = useNavigate()
const localStorageData = localStorage.getItem("participant");

// Parse the data if it exists, or set to null if not found
const parsedData: ParticipantData | null = localStorageData ? JSON.parse(localStorageData) : null;
const userRef = useRef<ParticipantData | null>(parsedData);
  const params = useParams()
  const [Room,setRoom] =useState<Room>({adminId : "",participants :[]})
    const [opened, { open, close }] = useDisclosure(false);
    const [active, setActive] = useState(1);
    const [candidate, setCandidate] = useState({photoUrl : "",fullname : ""});
    const [LeftParticipant, setLeftParticipant] = useState({fullname : ""});
    const [ShowLeftParticipant, setShowLeftParticipant] = useState(false);
    const [Messages, setMessages] = useState<Message[]>([]);
// Use a Set to store the unique messageId values

const uniqueMessageIds = new Set<string>();
useEffect(() => {
  // get the Room
  socket.emit("getRoom", {
    roomId: params.roomId
  });

  socket.on("getRoom", (data: { room: Room }) => {
    setRoom(data.room);
  });

  // somebody wants to join
  socket.on("somebodyWantToJoinRoom", (data: { roomId: string; adminId: string; user: any }) => {
    if (data.roomId === params.roomId) {
      if (userRef?.current?._id === data.adminId) {
        setCandidate(data.user);
        toggle();
      }
    }
  });

  // User Join
  socket.on("somebodyJoined", (data: { roomId: string,room :Room }) => {
    if (data.roomId === params.roomId) {
      setRoom(data.room);
      // const peer = addPeer(payload.signal, payload.callerID, stream);
      // peersRef.current.push({
      //   peerID: payload.callerID,
      //   peer,
      //   user: payload.user,
      // });

      // const peerObj = {
      //   peerID: payload.callerID,
      //   peer,
      //   user: payload.user,
      // };

      // setPeers((users) => [...users, peerObj]);
      joinAudio.current.play();
    }
  });

  // Message received
  socket.on("receiveMessage", (data: { roomId: string; message: Message }) => {
    console.log(data.message.createdTime);
    if (data.roomId === params.roomId && !uniqueMessageIds.has(data.message.messageId)) {
      // Add the message to the state and the Set if it's not already present
      setMessages((prevMessages:Message[]) => [...prevMessages, data.message]);
      uniqueMessageIds.add(data.message.messageId);
      msgAudio.current.play();
    }
  });

  // Left the Meet
  socket.on("leftMeeting", (data: { roomId: string; participant: any,room :Room }) => {
    if (data.roomId === params.roomId) {
      setLeftParticipant(data.participant);
      setRoom(data.room);
      setShowLeftParticipant(true);
      
      leaveAudio.current.play();
      setTimeout(() => {
        setShowLeftParticipant(false);
      }, 3000);
    }
  });

  // HandRaise
  // Socket event handling for raising hand
  socket.on("raiseHand", (data: { roomId: string; userId: string }) => {
    if (data.roomId === params.roomId) {
      sethandRaiseIds((prevHandRaiseIds:string[]) => [...prevHandRaiseIds, data.userId]);
    }
  });

  // Socket event handling for putting hand down
  socket.on("putHandDown", (data: { roomId: string; userId: string }) => {
    if (data.roomId === params.roomId) {
      sethandRaiseIds((prevHandRaiseIds:string[]) => prevHandRaiseIds.filter((id) => id !== data.userId));
    }
  });

  // Handle Media

  // listen To the media
}, []);
    // Manage user asking to join
    const [showCandidate,setShowCandidate] =useState(false)

    const toggle = () => { 
      setShowCandidate(!showCandidate)
     }

     const answerCandidature = (Adminanswer : string) :void => { 
      socket.emit("AnwserToCandidature",{
        answer: Adminanswer ==="accept"? true : false,
        roomId : params.roomId,
        user : candidate
      })
      toggle()
      }
     const LeftMeeting = () :void => { 
      socket.emit("leftMeeting",{
       
        roomId : params.roomId,
        user : userRef.current
      })
      navigate('/')
      }

      // Manage Message
      const [Message,setMessageContent] = useState("")

      const sendMessage = () => { 
        const message = {
          fullname : userRef?.current?.fullname,
          senderId : userRef?.current?._id,
          createdTime : new Date().toISOString(),
          content :Message,
          messageId :Math.random()
        }
        socket.emit("sendMessage",{
          message,
          roomId : params.roomId
        })
        setMessageContent("")
       }
      //  Emoji
      const EmojiPickerHandler = (emojiData : any) => { 
        console.log(emojiData)
        setMessageContent(Message +emojiData.emoji)
        
        }
const [emojiStatus,setEmojiStatus] = useState(false);

// Handle file
const FileInput = useRef<HTMLInputElement>(null);

const FileHandler =async (e :any) => { 

  try {
    const formData = new FormData();
    const roomId :string  =  params.roomId || ""
    formData.append('document', e.target.files[0]);
    formData.append('roomId',roomId);
    formData.append('senderId', userRef?.current?._id || "");
    formData.append('fullname', userRef?.current?.fullname || "");

    // Make the API call to your backend server for user signup
    const response = await httpClient.post('/auth/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    notifications.show({
      title: "Feedback About file Upload",
      color: "green",
      message: `File Uploaded successfully`,
    })
   
  } catch (error) {
    console.log(error)
  }
 }

//  Check
const [GridStyle,setGridStyle] = useState({})

useEffect(()=>{
  const gridTemplateAreas= calculateGridTemplateAreas(Room.participants.length)
  const gridStyle = {
    gridTemplateAreas: gridTemplateAreas,
  };
  setGridStyle(gridStyle)

},[Room])

// Hand Raise
const [handRaiseIds,sethandRaiseIds] = useState<any>([])






const handRaise = async() => { 
  socket.emit('raiseHand',{
    roomId : params.roomId,
    userId :userRef?.current?._id
  })
 }

const putHandDown = async() => { 
  socket.emit('putHandDown',{
    roomId : params.roomId,
    userId :userRef?.current?._id
  })
 }

// Media Part




// peer handling
const [loading, setLoading] = useState(true);
const [localStream, setLocalStream] = useState(null);
const [micOn, setMicOn] = useState(true);
const [showChat, setshowChat] = useState(true);
const [share, setShare] = useState(false);
const [pin, setPin] = useState(false);
const [peers, setPeers] = useState([]);
const peersRef = useRef([]);
const localVideoRef = useRef();

const [videoActive, setVideoActive] = useState(true);

  return (
    <div className='h-screen overflow-hidden flex flex-col p-4 relative' >
       {/* <video ref={videoRef} autoPlay playsInline /> */}
     <input ref={FileInput} type='file' className='hidden' onChange={FileHandler} />
      {/* Notification to join the meet */}
      <div className={`w-[17rem] z-50 drop-shadow-xl h-[8rem] bg-white rounded-xl absolute bottom-10 items-center justify-center right-4 gap-y-2  ${showCandidate ? "translate-y-[0rem]" : "translate-y-[12rem]"} transition duration-[200ms] ease-in-out delay-[100ms] z-40 flex-col flex p-3`} >
        <p className='text-black  text-sm ' >somebody want to join the meet </p>
        {/* User */}
          <div  className='h-[2rem] flex  gap-x-2 items-center  w-full ' >
            <Avatar radius="xl" src={apiUrl + candidate.photoUrl} size={30}  />
         <p className='text-black  text-sm ' >{candidate.fullname} </p>

          </div>
        {/* Bttuon */}
        <div className='flex items-center gap-x-3' >
          <Button onClick={()=>answerCandidature("accept")} className='text-blue-400 hover:bg-white' >accepter</Button>
          <Button onClick={()=>answerCandidature("refuse")} className='text-blue-400 hover:bg-white' >refuser</Button>
        </div>
      </div>

      {/* Left Notification */}
      <div className={`w-[23rem] h-[3rem] bg-black rounded-xl absolute bottom-10 gap-x-2 items-center px-2  justify-center left-4 gap-y-2  ${ShowLeftParticipant ? "translate-y-[0rem]" : "translate-y-[12rem]"} transition duration-[200ms] ease-in-out delay-[100ms] z-40  flex p-3`} >
        {/* User */}
         
         <p className='text-white   ' >  {LeftParticipant.fullname} </p>
            
      
        
        <p className='text-white' >left </p>
      </div>
      {/* drawer */}
<Drawer position='right' opened={opened} onClose={close} >
<Tabs   defaultValue="messages">
      <Tabs.List>
        <Tabs.Tab value="task" icon={<BsListTask size="0.8rem" />}>Task</Tabs.Tab>
        <Tabs.Tab value="messages" icon={<BiMessageDetail size="0.8rem" />}>Messages</Tabs.Tab>
        <Tabs.Tab value="participants" rightSection={
            <Badge
              w={16}
              h={16}
              color="gray"
              sx={{ pointerEvents: 'none' }}
              variant="filled"
              size="xs"
              p={0}
            >
             {Room.participants.length}
            </Badge>
          } icon={<BsFillPeopleFill size="0.8rem" />}>Participants</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="task" pt="xs">
        <div className='h-[85vh] pt-4' >
        <Stepper active={active} onStepClick={setActive} orientation="vertical">
      <Stepper.Step label="Step 1" description="Create an account" />
      <Stepper.Step label="Step 2" description="Verify email" />
      <Stepper.Step label="Step 3" description="Get full access" />
      <Stepper.Step label="Step 3" description="Get full access" />
    </Stepper>
        </div>
      </Tabs.Panel>

      <Tabs.Panel value="messages" pt="xs">
      <div className=' flex flex-col h-[85vh] ' >
        <ul className='flex-1 flex-col overflow-y-scroll  gap-y-4 flex  list-none' >
        {Messages.map((message:Message) => {
  if (message.type === "file") {
    return (
      <li key="file-item" className={`min-h-[3rem] p-3  flex-col ${message.fullname === userRef?.current?.fullname ? "self-end" : "self-start"}  cursor-pointer max-w-[80%] flex px-2 items-center `}>
        <p className={`${message.fullname === userRef?.current?.fullname ? "self-end" : "self-start"} font-semibold `}>{message.fullname === userRef?.current?.fullname ? "vous" : message.fullname}</p>
        <div className={`flex-1 flex rounded-lg p-3 ${message.senderId === userRef?.current?._id ? "  self-end bg-blue-500" : "bg-gray-300"}`} >        <img src={MapType.has(`${message.fileType.split("/")[1]}`) ? MapType.get(`${message.fileType.split("/")[1]}`) : MapType.get("unknown")} className={`h-8 w-8`} />
        <Link target="_blank"  className={message.senderId === userRef?.current?._id ? "text-white" : "text-black"} to={apiUrl + message.url} >{message.name}</Link>
        </div>

      </li>
    );
  } else {
    return (
      <li key={message.messageId} className={`min-h-[4rem] ${message.senderId === userRef?.current?._id ? "self-end" : ""}  max-w-[70%] px-4 gap-x-3 flex-col flex`}>
        <p className='font-semibold self-end'>{message.fullname === userRef?.current?.fullname ? "vous" : message.fullname}</p>
        <div className={`flex-1 h-auto flex flex-col p-4 rounded-lg ${message.senderId === userRef?.current?._id ? "bg-blue-500" : "bg-gray-300"}`}>
          <p className={message.senderId === userRef?.current?._id ? "text-white" : 'text-black'}>{message.content}</p>
          <p className={message.senderId === userRef?.current?._id ? 'text-white text-sm self-end' : 'text-sm self-end text-black'}>{<TimeAgo locale='fr' datetime={message.createdTime} />}</p>
        </div>
      </li>
    );
  }
})}

        
       
       
        </ul>
        { emojiStatus &&  (<div className="absolute bottom-20 right-2 " >
  <EmojiPicker onEmojiClick={EmojiPickerHandler} />

  </div>) }
        <div className='h-[4rem] p-4 flex items-center w-full gap-x-2 border-t-2' >
            <AiOutlinePaperClip onClick={()=> FileInput?.current?.click()} className='cursor-pointer' size={24} />
            <Input
      rightSection={    <BsEmojiSmile onClick={()=> setEmojiStatus(!emojiStatus)} size={24} color={emojiStatus ? "#1877f2" : "#000"} className={`mr-3 cursor-pointer text-current ${emojiStatus ? "text-blue-400" : "text-black"} `} />
    }
      onChange={(e:FormEvent<HTMLInputElement>)=>setMessageContent(e.currentTarget.value)}
      placeholder="entrez votre message"
      className='bg-red-100 flex-1'
      size="md"
      value={Message}
    />
    <Button onClick={()=> sendMessage()} className='bg-blue-700 hover:bg-blue-900 p-2' ><FaPaperPlane size={20} color="white" /> </Button>
        </div>
       </div>
      </Tabs.Panel>

      <Tabs.Panel value="participants" pt="xs">
       <ul className='flex-1 h-[80vh] list-none' >
       {Room.participants.map((participant:Participant,indx:number) => (
         <li key={indx.toString()} className='h-[4rem]  px-4 gap-x-3  flex items-center' >
         <Avatar src={apiUrl+ participant.photoUrl} radius={30} size={50} />
         <div className='flex-1' >
             <p className='font-semibold'>{userRef?.current?.fullname ===participant.fullname? "Vous" : participant.fullname} {participant._id ===Room.adminId ?`(organisateur)` : "" }</p>
             <p className='text-gray-400'>{participant.email}</p>
         </div>
         <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
   <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

   </div>
     </li>
       ))}
       
       
       </ul>
      </Tabs.Panel>
    </Tabs>
      </Drawer>
{/* Date */}
<h2 className='text-gray-400' >Mecredi 26 juillet 2023</h2>
{/* Title and Time */}
<div className='h-[3rem] w-full flex items-center justify-between' >
    <p className='text-xl font-semibold' >Reunion journaliere</p>
    <div className='h-[2.3rem] bg-white w-[8rem] drop-shadow-md border justify-center flex items-center  rounded-full' >
        <p className='text-lg text-gray-400 font-semibold tracking-wider' >00:12:04</p>
    </div>
</div>
{/* participants */}
<div style={GridStyle} className={`flex-1 grid gap-2 border rounded-lg relative`}>
  {/* Me Or Presentation */}
  { Room.participants.map((participant,index)=> (
         <MeetGrid handRaiseIds={handRaiseIds} userRef={userRef} userVideoRef={localVideoRef} participant={participant} index={index} />
      )) }
</div>

{/* Option */}
<div className='h-[3.5rem] w-full  flex items-center justify-between' >

        
         <div className='h-[2.3rem] bg-white p-2  w-[12rem] gap-x-3 border-[0.09rem]  border-gray-400 justify-center flex items-center  rounded-md' >
        <p className='text-base text-gray-400 tracking-wider' >{params.roomId}</p>
        <div className='h-full w-[0.1rem] bg-gray-200' ></div>
        <CopyButton value={`${frontendUrl}?r=${params.roomId}`} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
          <IoCopyOutline className='cursor-pointer'  />
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
        
        
    </div>
      
   

   {/* The Main Feature */}
   <div className='h-auto bg-white p-2  min-w-[12rem] gap-x-6 relative  border-gray-400 justify-center flex items-center  rounded-md' >
    {/* Microphone */}
      <div className='bg-red-600 h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

      </div>
      {/* video */}
      <div className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BiSolidVideo  color='gray'  className='cursor-pointer'  />

      </div>
      {/* recording */}
      <div onClick={()=> toggle()} className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BsRecordBtn  color='gray'  className='cursor-pointer'  />

      </div>
      {/* Sharing */}
      <div className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <MdScreenShare  color='gray'  className='cursor-pointer'  />

      </div>
      {/* Message */}
      <div onClick={open} className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BiMessageDetail  color='gray'  className='cursor-pointer'  />

      </div>
      {/* dots */}
      <div className='bg-white   relative shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <Menu position="top" offset={130} shadow="md" width={270}>
      <Menu.Target>
      <BiDotsHorizontalRounded  color='gray'  className='cursor-pointer'  />

      </Menu.Target>

      <Menu.Dropdown>
       
    <Menu.Item className={handRaiseIds.includes(userRef?.current?._id)?"bg-blue-200" :"bg-white"} onClick={()=> handRaiseIds.includes(userRef?.current?._id)? putHandDown() : handRaise()}  icon={<PiHandFill size={14} />}>hand Raise</Menu.Item>
    {/* <Menu.Item  icon={<BsEmojiSmile size={14} />}>send Emoji</Menu.Item> */}

      </Menu.Dropdown>
    </Menu>

      </div>
    </div>
{/* Leave the meet */}
    <Button onClick={()=>LeftMeeting()} className='bg-red-500 hover:bg-red-700'>Leave meet</Button>
</div>
    </div>
  )
}

export default RoomScreen 