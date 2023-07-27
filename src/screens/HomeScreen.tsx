import React, { useState } from 'react'
import Logo from '../assets/googleMeet.png'
import {BsQuestionOctagon} from 'react-icons/bs'
import {PiWarningOctagon} from 'react-icons/pi'
import {MdVideoCall} from 'react-icons/md'
import {FiSettings} from 'react-icons/fi'
import {BiSolidKeyboard} from 'react-icons/bi'
import {IoIosArrowBack, IoIosArrowForward} from 'react-icons/io'
import {CgMenuGridO} from 'react-icons/cg'
import { Avatar, Button, Input, TextInput } from '@mantine/core'
import image1 from '../assets/image1.svg'
import image2 from '../assets/image2.svg'
import image3 from '../assets/image3.svg'
interface CarouselItem {
    id: number;
    imageUrl :string;
    title : string;
    desc : string

}

function HomeScreen() {
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
  return (
    <div className='h-screen flex-1 flex flex-col ' >
{/* NavBar */}
<nav className='h-[4.5rem] pl-3 flex items-center justify-between border-b-2 border-gray-300 w-full ' >
    <div className=' hidden md:flex items-center w-[12rem]' >
    <img src={Logo} className='  h-[2rem]' />
    <p className='ml-2 text-lg' >Meet</p>
    </div>

    {/* Other information */}
    <div className='items-center flex  ' >
        <p className='text-lg md:block hidden text-gray-500' >20:32</p>.
        <p className='text-lg text-gray-500' >mer 26 juillet</p>
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

        <Avatar color="cyan" radius="xl">Y</Avatar>
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
            <Button leftIcon={<MdVideoCall size={25} color='white' /> } className='bg-[#1B73E8] h-[3rem]' >Nouvelle reunion</Button>
            {/* Join Session */}
            <Input
      icon={<BiSolidKeyboard size={23} />}
      
      placeholder="entrez le code du lien"
      className='bg-red-100'
      size="lg"
    />
                <Button  className='text-gray-300 h-[3rem]' >Participer</Button>

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