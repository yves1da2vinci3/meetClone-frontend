import { Button, LoadingOverlay, PasswordInput, TextInput } from '@mantine/core'
import React, { FormEvent, FormEventHandler, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import {FcGoogle} from 'react-icons/fc'
import {notifications} from '@mantine/notifications'
import httpClient from '../config/ApiUrl'
function Login() {
    const [email,setEmail] = useState<string>("")
    const [password,setPassword] = useState<string>("")
      const [isLoading,setIsLoading] = useState<boolean>(false)
      const navigate = useNavigate()
    const login = async () => {
        try {
          // Basic email and password validation
          if (!isValidEmail(email)) {
            notifications.show({
              title: "Feedback Authentication",
              color: "red",
              message: `Please enter a valid email address.`,
            });
            console.error('Please enter a valid email address.');
            return;
          }
    
          if (!password) {
            notifications.show({
              title: "Feedback Authentication",
              color: "red",
              message: `Please enter your password.`,
            });
            console.error('Please enter your password.');
            return;
          }
    setIsLoading(true)
         const {data} =   await httpClient.post("/auth/login",{email,password})
         localStorage.setItem("participant",JSON.stringify(data.user) )
         navigate("/")
         
        } catch (error : any) {
    setIsLoading(false)

          // Handle any network or server-related errors
          console.error('An error occurred during login:', error);
          notifications.show({
            title: "Feedback Authentication",
            color: "red",
            message: ` ${error.response.data.message}`,
          });
        }
      };
    
      const isValidEmail = (email:string) => {
        // Basic email validation using a regular expression
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
    
  return (
    <div className='h-screen items-center flex-col gap-y-3 justify-center flex' >
        <p className='md:text-xl text-lg font-semibold  ' >Welcome back</p>
        <div className=' w-[23rem] md:w-[30rem] bg-white border shadow gap-y-2 h-[20rem] flex-col justify-center flex p-3 ' >
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
            <p className='text-lg ' >Email</p>
            <TextInput onChange={(e :FormEvent<HTMLInputElement>)=> setEmail(e.currentTarget.value) } placeholder='entrez votre mail' title='email' />
            <p className='text-lg ' >Mot de passe</p>
            <PasswordInput onChange={(e :FormEvent<HTMLInputElement>)=> setPassword(e.currentTarget.value) } placeholder='entrez votre mot de passe' />
            <Button  onClick={login} className='bg-blue-500 mt-3 hover:bg-blue-700' >Se connecter</Button>
        </div>
        <div className="h-[3.5rem] flex gap-x-4 justify-center flex-row items-center  " >
            <div className=" h-[3rem] w-[3rem] rounded  shadow hover:shadow-md cursor-pointer items-center justify-center flex  " >
                <FcGoogle />
            </div>
            
            
         </div>
         <p className='text-center'>pas encore enregistré ? <Link className='text-blue-400 cursor-pointer ' to="/signup"  >s'enregistrer</Link></p>
    </div>
  )
}

export default Login