import { Avatar, Badge, Button, Drawer, Input, Stepper, Tabs } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import React, { useState } from 'react'
import { BiDotsHorizontalRounded, BiMessageDetail, BiMicrophoneOff, BiSmile, BiSolidVideo } from 'react-icons/bi'
import { BsFillPeopleFill, BsListTask, BsRecordBtn, BsSoundwave } from 'react-icons/bs'
import {IoCopyOutline} from 'react-icons/io5'
import {AiOutlinePaperClip} from 'react-icons/ai'
import { MdScreenShare } from 'react-icons/md'
import { FaPaperPlane } from 'react-icons/fa'
import { PiHandFill } from 'react-icons/pi'
function RoomScreen() {
    const [opened, { open, close }] = useDisclosure(true);
    const [active, setActive] = useState(1);
  return (
    <div className='h-screen flex flex-col p-4 ' >
<Drawer position='right' opened={opened} onClose={close} >
<Tabs   defaultValue="messages">
      <Tabs.List>
        <Tabs.Tab value="task" icon={<BsListTask size="0.8rem" />}>Task</Tabs.Tab>
        <Tabs.Tab rightSection={
            <Badge
              w={16}
              h={16}
              sx={{ pointerEvents: 'none' }}
              variant="filled"
              size="xs"
              p={0}
            >
              6
            </Badge>
          } value="messages" icon={<BiMessageDetail size="0.8rem" />}>Messages</Tabs.Tab>
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
              6
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
        <ul className='flex-1 flex-col  gap-y-4 flex  list-none' >
        <li className='min-h-[4rem]  px-4 gap-x-3 flex-col  flex' >
            <p className='font-semibold' >Yves</p>
            <div className='flex-1 h-auto flex flex-col p-4 max-w-[70%] rounded-lg bg-blue-500 ' >
               
                <p className='text-white'>Yve.jjas.sahf@gmail.com dsdsdsdsdsdsdsdsdsdsd  dsdsd sd sd s</p>
                <p className='text-sm self-end text-white'>11:30</p>
            </div>
          
            
        </li>
        <li className='min-h-[4rem] self-end  max-w-[70%] px-4 gap-x-3 flex-col  flex' >
            <p className='font-semibold self-end' >Elon Musk</p>
            <div className='flex-1 h-auto flex flex-col p-4  rounded-lg bg-gray-300 ' >
               
                <p className='text-black'>Yve.jjas.sahf@gmail.com dsdsdsdsdsdsdsdsdsdsd  dsdsd sd sd s</p>
                <p className='text-sm self-end text-black'>11:31</p>
            </div>
          
            
        </li>
       
        </ul>
        <div className='h-[4rem] p-4 flex items-center w-full gap-x-2 border-t-2' >
            <AiOutlinePaperClip className='cursor-pointer' size={24} />
            <Input
      rightSection={<BiSmile className='cursor-pointer' size={23} />}
      
      placeholder="entrez votre message"
      className='bg-red-100 flex-1'
      size="md"
    />
    <Button className='bg-blue-700 hover:bg-blue-900 p-2' ><FaPaperPlane size={20} color="white" /> </Button>
        </div>
       </div>
      </Tabs.Panel>

      <Tabs.Panel value="participants" pt="xs">
       <ul className='flex-1 h-[80vh] list-none' >
        <li className='h-[4rem]  px-4 gap-x-3  flex items-center' >
            <Avatar src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToTzNYRzqZ9WAaUMzdhN5te06UV12rIhsGYQiZI70oPQ&s" radius={30} size={50} />
            <div className='flex-1' >
                <p className='font-semibold'>Yves Lionel Diomande</p>
                <p className='text-gray-400'>Yve.jjas.sahf@gmail.com</p>
            </div>
            <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
      <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

      </div>
        </li>
        <li className='h-[4rem]  px-4 gap-x-3  flex items-center' >
            <Avatar src="https://cdn.futura-sciences.com/buildsv6/images/largeoriginal/d/9/a/d9a1058910_50163142_elon-musk1.jpg" radius={30} size={50} />
            <div className='flex-1' >
                <p className='font-semibold'>Elon Musk</p>
                <p className='text-gray-400'>Yve.jjas.sahf@gmail.com</p>
            </div>
            <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
      <BsSoundwave  color='white'  className='cursor-pointer'  />

      </div>
        </li>
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
<div className='flex-1 border rounded-lg flex items-center justify-center relative' >
    {/* Me Or Presentation */}
    <Avatar size={200} color="cyan" radius="xl" >Y</Avatar>
      
    {/* Others */}
    <div className='h-[11rem] absolute top-3 left-0  gap-x-5 overflow-x-scroll items-center flex px-2 ' >
        <div className='h-[10rem] items-center flex justify-center w-[13rem] rounded-lg bg-black relative' >
            <img className='h-[4rem] w-[4rem] rounded-full' src='https://cdn.futura-sciences.com/buildsv6/images/largeoriginal/d/9/a/d9a1058910_50163142_elon-musk1.jpg' />
            <div className='absolute bottom-0 z-40  h-[3rem] items-center flex justify-between px-2  w-full' >
                <p className='text-white' >Elon musk</p>
                <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
      <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

      </div>
            </div>
        </div>
        <div className='h-[10rem] w-[13rem] rounded-lg bg-red-200 relative' >
            <img className='h-[10rem] w-[16rem] rounded-lg' src='https://cdn.futura-sciences.com/buildsv6/images/largeoriginal/d/9/a/d9a1058910_50163142_elon-musk1.jpg' />
            <div className='absolute bottom-0 z-40  h-[3rem] items-center flex justify-between px-2  w-full' >
                <p className='text-white' >Elon musk</p>
                <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
      <BsSoundwave  color='white'  className='cursor-pointer'  />

      </div>
            </div>
        </div>
        <div className='h-[10rem] w-[13rem] rounded-lg bg-red-200 relative' >
            {/* Hand Raise */}
            <PiHandFill className='absolute right-4 top-2' size={20} />
            <img className='h-[10rem] w-[16rem] rounded-lg' src='https://cdn.futura-sciences.com/buildsv6/images/largeoriginal/d/9/a/d9a1058910_50163142_elon-musk1.jpg' />
            <div className='absolute bottom-0 z-40  h-[3rem] items-center flex justify-between px-2  w-full' >
                <p className='text-white' >Elon musk</p>
                <div className='bg-blue-600 h-8 w-8 cursor-pointer flex items-center justify-center rounded-full'>
      <BsSoundwave  color='white'  className='cursor-pointer'  />

      </div>
            </div>
        </div>
        
    </div>
</div>

{/* Option */}
<div className='h-[3.5rem] w-full  flex items-center justify-between' >
<div className='h-[2.3rem] bg-white p-2  w-[12rem] gap-x-3 border-[0.09rem]  border-gray-400 justify-center flex items-center  rounded-md' >
        <p className='text-base text-gray-400 tracking-wider' >xyz-aw2-ds</p>
        <div className='h-full w-[0.1rem] bg-gray-200' ></div>
       
        <IoCopyOutline className='cursor-pointer'  />
    </div>
   {/* The Main Feature */}
   <div className='h-auto bg-white p-2  min-w-[12rem] gap-x-6   border-gray-400 justify-center flex items-center  rounded-md' >
    {/* Microphone */}
      <div className='bg-red-600 h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BiMicrophoneOff  color='white'  className='cursor-pointer'  />

      </div>
      {/* video */}
      <div className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BiSolidVideo  color='gray'  className='cursor-pointer'  />

      </div>
      {/* recording */}
      <div className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
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
      <div className='bg-white shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md'>
      <BiDotsHorizontalRounded  color='gray'  className='cursor-pointer'  />

      </div>
    </div>
{/* Leave the meet */}
    <Button className='bg-red-500 hover:bg-red-700'>Leave meet</Button>
</div>
    </div>
  )
}

export default RoomScreen 