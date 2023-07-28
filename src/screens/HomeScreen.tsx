import React, { FormEvent, useEffect, useState } from 'react'
import Logo from '../assets/googleMeet.png'
import {BsQuestionOctagon} from 'react-icons/bs'
import {PiWarningOctagon} from 'react-icons/pi'
import {MdEmail, MdVideoCall} from 'react-icons/md'
import {FiSettings} from 'react-icons/fi'
import {BiLogOut, BiSolidKeyboard, BiVoicemail} from 'react-icons/bi'
import {IoIosArrowBack, IoIosArrowForward} from 'react-icons/io'
import {CgMenuGridO} from 'react-icons/cg'
import { Avatar, Button, Input, LoadingOverlay, Menu, TextInput } from '@mantine/core'
import image1 from '../assets/image1.svg'
import image2 from '../assets/image2.svg'
import image3 from '../assets/image3.svg'
import { useLocation, useNavigate } from 'react-router-dom'
import getInitials from '../utils/getInitials'
import generateKey from '../utils/generateKey'
import { notifications } from '@mantine/notifications'
import { apiUrl } from '../config/ApiUrl'
interface CarouselItem {
    id: number;
    imageUrl :string;
    title : string;
    desc : string

}

interface HomeProps {
    socket :any
}

function useCurrentTime(): string {
    const [currentTime, setCurrentTime] = useState<string>('');
  
    useEffect(() => {
      const updateTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setCurrentTime(`${hours}:${minutes}`);
      };
  
      updateTime(); // Call it immediately to set the initial time
  
      // Update time every second (1000ms)
      const intervalId = setInterval(updateTime, 1000);
  
      // Clear the interval when the component unmounts to prevent memory leaks
      return () => clearInterval(intervalId);
    }, []);
  
    return currentTime;
  }
  
  function useCurrentDate(): string {
    const [currentDate, setCurrentDate] = useState<string>('');
  
    useEffect(() => {
      const updateDate = () => {
        const now = new Date();
        const days = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
        const months = [
          'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
          'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ];
        const dayOfWeek = days[now.getDay()];
        const dayOfMonth = now.getDate();
        const month = months[now.getMonth()];
        setCurrentDate(`${dayOfWeek} ${dayOfMonth} ${month}`);
      };
  
      updateDate(); // Call it immediately to set the initial date
  
      // Update date every day (86400000ms)
    //   const intervalId = setInterval(updateDate, 86400000);
  
      // Clear the interval when the component unmounts to prevent memory leaks
    //   return () => clearInterval(intervalId);
    }, []);
  
    return currentDate;
  }
  
function HomeScreen({socket}:HomeProps) {
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
      const [isLoading,setIsLoading] = useState(false)
      
      const currentTime = useCurrentTime();
      const currentDate = useCurrentDate();
      
      
    const [carouselIndex,setCarouselIndex] = useState(0)
    const CarouselItems :CarouselItem[]  =[
        {
            id : 1,
            imageUrl : image1,
            title : "Obtenir un lien de partage",
            desc : "Cliquez sur nouvelle reunion pour obtenir le lien à envoyer aux personnes que vous souhaitez inviter à une réunion"
        },
        {
            id : 2,
            imageUrl : image2,
            title : "Planifier et anticiper",
            desc : "Cliquez sur  nouvelle reunion  pour planifier des réunions dans Google Agenda et envoyer des invitations aux participants"
        },
        {
            id : 2,
            imageUrl : image3,
            title : "Votre réunion est sécurisée",
            desc : "Personne ne peut rejoindre une réunion sans y avoir été invité ou admis par l'organisateur"
        },
    ]
    const navigate = useNavigate()
    const [focused, setFocused] = useState(false);
    const logout = ():void => { 
        localStorage.removeItem("participant")
        navigate("/login")
     }
     useEffect(() => {
        if (!localStorage.getItem("participant")) {
          navigate("/login");
        }
      }, [localStorage.getItem("participant")]);

      const [RoomId,setRoomId] = useState("")

    //  Handle CreateRoom
    const HandlerRoomCreation = ():void => { 
        setIsLoading(true)
        const RoomId = generateKey()
        socket.emit('createRoom',{
          user : JSON.parse(localStorage.getItem('participant')),
          roomId : RoomId,
        })
        socket.on("feedbackCreatingRoom",(data:object)=> {
          if(data.status === "success"){
            setIsLoading(false)
            navigate(`/room/${RoomId}`)
          }
        })
        }
        // Handle Join
      const joinRoom = (roomId :string):void => {
        setIsLoading(true)
        console.log("click on join button");
        socket.emit("joinRoom", {
          roomId: roomId ? roomId : RoomId,
          user : JSON.parse(localStorage.getItem("participant")),
        });
      
        socket.on("feedbackJoiningRoom", (data) => {
            if(data.roomId === RoomId || data.roomId === queryParams.get('r') && data.askerId === JSON.parse(localStorage.getItem("participant") )._id ){
                console.log("ahi")
                if (data.status === "success") {
                    console.log("working");
                    // Update the roomId state variable with the user input
              
                    setIsLoading(false)
                    navigate(`/room/${RoomId ?RoomId : queryParams.get('r')}`)
                  } else {
                    setIsLoading(false)
                    notifications.show({
                      title: "Feedback About Joining room",
                      color: "red",
                      message: `${data.message}`,
                    });
                  }
            }
         
        });
        
      
      };
      useEffect(()=>{
       
        const roomId = queryParams.get('r');
        
        if(roomId){
            joinRoom(roomId);
        }
      },[])
  return (
    <div className='h-screen flex-1 flex flex-col ' >
          <LoadingOverlay visible={isLoading} />

{/* NavBar */}
<nav className='h-[4.5rem] pl-3 flex items-center justify-between border-b-2 border-gray-300 w-full ' >
    <div className=' hidden md:flex items-center w-[12rem]' >
    <img src={Logo} className='  h-[2rem]' />
    <p className='ml-2 text-lg' >Meet</p>
    </div>

    {/* Other information */}
    <div className='items-center flex  ' >
        <p className='text-lg md:block hidden text-gray-500' >{currentTime}</p>
        <div className={`h-1 w-1 bg-gray-500 mx-1  rounded-full`} ></div>
        <p className='text-lg text-gray-500' >{currentDate}</p>
        <div className='h-10 w-10 ml-4 flex items-center justify-center rounded-full cursor-pointer bg-white hover:bg-gray-200' >
        <BsQuestionOctagon className='' size={23} color='gray' />

        </div>
        <div className='h-10 w-10 ml-4 flex items-center justify-center rounded-full cursor-pointer bg-white hover:bg-gray-200' >
        <PiWarningOctagon  size={23} color='gray' />

        </div>
        <div className='h-10 ml-4 w-10 flex items-center justify-center rounded-full cursor-pointer bg-white hover:bg-gray-200' >
        <FiSettings className='' size={23} color='gray' />

        </div>
        <div className='flex mr-4 items-center gap-x-4' >
        <div className='h-10 ml-4 w-10 flex items-center justify-center rounded-full cursor-pointer bg-white hover:bg-gray-200' >
        <CgMenuGridO className='' size={23} color='gray' />

        </div>
        <Menu  position="bottom-end" shadow="md" width={270}>
      <Menu.Target>
      <Avatar className='cursor-pointer' color="cyan" radius="xl">{getInitials( JSON.parse(localStorage.getItem("participant"))?.fullname ||"ybes" )}</Avatar>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item    > <div className="flex items-center gap-x-3" >   <div className="h-6 w-6 rounded-full " >
        <Avatar  className="rounded-full"  src={apiUrl+ JSON.parse(localStorage.getItem("participant"))?.photoUrl} alt="userImg" size={25} />
    </div><p>{JSON.parse(localStorage.getItem("participant"))?.fullname  }</p></div> </Menu.Item>
    <Menu.Item icon={<MdEmail size={14} />}>{JSON.parse(localStorage.getItem("participant"))?.email  }</Menu.Item>
    <Menu.Item onClick={()=>logout()} icon={<BiLogOut size={14} />}>Se deconnecter</Menu.Item>

      </Menu.Dropdown>
    </Menu>
       
        </div>
    </div>
</nav>
{/* the Rest of the content */}
<div className='flex-1  md:grid flex flex-col md:grid-cols-2' >
    {/* Text */}

    <div className='items-center justify-center  flex' >
        <div className='h-auto w-full mt-12 md:w-[34rem] flex-col gap-y-7 flex ' >
        <h1 className='text-4xl tracking-normal md:text-left text-center ' >La visioconférence haute qualité, maintenant disponible pour tous</h1>
        <h1 className='text-lg text-gray-500 tracking-wide md:text-left text-center' >Nous avons adapté Google Meet, notre service de visioconférence professionnel sécurisé, afin de le rendre disponible pour tous.</h1>

        {/* Button */}
        <div className='flex md:flex-row flex-col gap-y-2 items-center mt-10 md:mt-24 gap-x-2' >
            {/* New Session */}
            <Button onClick={()=>HandlerRoomCreation()} leftIcon={<MdVideoCall size={25} color='white' /> } className='bg-[#1B73E8] h-[3rem]' >Nouvelle reunion</Button>
            {/* Join Session */}
            <Input
            onChange={(e  :FormEvent<HTMLInputElement>)=> setRoomId(e.currentTarget.value)}
      icon={<BiSolidKeyboard size={23} />}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="entrez le code du lien"
      className='bg-red-100'
      size="lg"
    />
              {focused ===true || RoomId.length>3 ?  <Button onClick={()=>joinRoom()}  className={`${RoomId.length>3 ? "text-blue-500 font-semibold" : "text-gray-300"}  bg-white hover:bg-white h-[3rem]`}>Participer</Button> : null}  

        </div>
        </div>
        
    </div>

    {/* Carousel */}
    <div className=' flex-col items-center justify-center flex' >
        <div className=' w-full md:w-[34rem] justify-center h-auto flex items-center gap-x-4 ' >
            <div onClick={()=> carouselIndex ===0 ? console.log("first") : setCarouselIndex(carouselIndex-1)}className={`h-10 w-10 ${carouselIndex ===0 ? "" : "hover:bg-gray-200" } rounded-full items-center cursor-pointer flex justify-center`} >
                <IoIosArrowBack/>
            </div>
            <img src={CarouselItems[carouselIndex].imageUrl} className='h-[20rem] w-[20rem]' />
            <div onClick={()=> carouselIndex ===2 ? console.log("first") : setCarouselIndex(carouselIndex+1)} className={`h-10 w-10 ${carouselIndex ===2 ? "" : "hover:bg-gray-200" } rounded-full items-center cursor-pointer flex justify-center`}  >
            <IoIosArrowForward  />
            </div>

        </div>
        <div className='w-full md:w-[34rem] h-auto mt-2 flex flex-col items-center gap-x-2 ' >
            <p className='text-lg font-semibold'>{CarouselItems[carouselIndex].title}</p>
            <p className='text-center' >{CarouselItems[carouselIndex].desc}</p>

        </div>
        <div className='w-full mb-3 md:w-[34rem] h-auto justify-center mt-2 flex  items-center gap-x-2 ' >
            {[1,2,3].map((_,indx)=>  (<div className={`h-2 w-2 ${carouselIndex !== indx ? "bg-gray-400" : "bg-blue-400" }  rounded-full`} ></div>))}
        
        </div>
    </div>
</div>
    </div>
  )
}

export default HomeScreen