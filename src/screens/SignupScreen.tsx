import {FcGoogle} from 'react-icons/fc'
import {FaGithub} from 'react-icons/fa'
import { EventHandler, FormEvent, createRef, useRef, useState } from 'react'
import { BsArrowLeft, BsPlus } from 'react-icons/bs'
import { Avatar, LoadingOverlay, MultiSelect, PasswordInput, TextInput } from '@mantine/core'
import { Link, useNavigate } from 'react-router-dom'
import httpClient from '../config/ApiUrl'
import { notifications } from '@mantine/notifications'
export default function Signup() {
       const [file,setFile] = useState(null)
       const fileHandler = (e :any ) => { 
        setFile(e.target.files[0])
       }
       const [email,setEmail] = useState("")
       const [password,setPassword] = useState("")
       const [confirmPassword,setConfirmPassword] = useState("")
       const [isLoading,setIsLoading] = useState(false)
       const [Username,setUsername] = useState("")
       const fileInput = createRef<HTMLInputElement>()
       const [stepStatus,setstepStatus] = useState(1)
    //    Data
  
    const navigate = useNavigate()
    const SignupHandler = async () => {
      try {
        // Basic form validation
        if (!email || !isValidEmail(email)) {
          notifications.show({
            title: "Feedback About registration",
            color: "red",
            message: `Please enter a valid email address.`,
          });
          console.error('Please enter a valid email address.');
          return;
        }
  
        if (!password) {
          notifications.show({
            title: "Feedback About registration",
            color: "red",
            message: `Please enter your password.`,
          });
          console.error('Please enter your password.');
          return;
        }
  
        if (password !== confirmPassword) {
          notifications.show({
            title: "Feedback About registration",
            color: "red",
            message: `Passwords do not match.`,
          });
          console.error('Passwords do not match.');
          return;
        }
  
        if (!Username) {
          notifications.show({
            title: "Feedback About registration",
            color: "red",
            message: `Please enter your username..`,
          });
          console.error('Please enter your username.');
          return;
        }
        if (!file) {
          notifications.show({
            title: "Feedback About registration",
            color: "red",
            message: `Please pick an image..`,
          });
          console.error('Please pick an image..');
          return;
        }
        setIsLoading(true)
        // Create a FormData object to send the file along with other form data
        const formData = new FormData();
        if (file) {
          formData.append('image', file);
        }
        if (email) {
          formData.append('email', email);
        }
        if (password) {
          formData.append('password', password);
        }
        if (Username) {
          formData.append('fullName', Username);
        }
  
        // Make the API call to your backend server for user signup
        const response = await httpClient.post('/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        if (response.status === 201) {
          // If signup is successful, you can handle the next steps here (e.g., redirect to dashboard)
          console.log('Signup successful!');
          notifications.show({
            title: "Feedback About registration",
            color: "green",
            message: `Signup successful!`,
          });
          navigate("/login")
        } else {
          // If signup fails, handle the error
          notifications.show({
            title: "Feedback About registration",
            color: "red",
            message: `${response.data.message}`,
          });
        setIsLoading(false)

          console.error('Signup failed:', response.data.message);
        }
      } catch (error :any) {
        // Handle any network or server-related errors
        notifications.show({
          title: "Feedback About registration",
          color: "red",
          message: `${error.response.data.message}`,
        });
      setIsLoading(false);
        console.error('An error occurred during signup:', error);
      }
    };
  
    const isValidEmail = (email:string) => {
      // Basic email validation using a regular expression
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    return ( <div className="h-screen w-screen  items-center flex-col  justify-center flex" >
        <div className='flex items-center mb-5' > <h1 className='font-bold text-2xl' >Join the meet Family</h1>  </div>
      {/* Main Container */}
        <div className="min-h-[35rem] w-[23rem] md:w-[30rem] flex shadow drop-shadow-md flex-row gap-y-4 overflow-hidden bg-white rounded" >
            {/* First Step */}
           <div className="min-h-[35rem] w-[30rem] flex shadow drop-shadow-md flex-col gap-y-4  rounded p-5 bg-white" >
        <input onChange={fileHandler} type="file" className='hidden' ref={fileInput} />

        <div className='h-36 w-36  relative rounded-full self-center ' >
            
        <Avatar   className='h-36 w-36 rounded-full' alt='userImg'  src={file ? URL.createObjectURL(file) : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} />
        <div onClick={()=> fileInput?.current?.click() } className='h-10 w-10 cursor-pointer hover:bg-black-800 bg-blue-600 bottom-0 right-2 absolute flex items-center justify-center rounded-full ' >
          <BsPlus size={28} color='white' />
        </div>
      </div>
            <div>
            <label htmlFor="email">Email </label>
            <TextInput onChange={(e:FormEvent<HTMLInputElement> )=> setEmail(e.currentTarget.value)} id="email" className="h-[3rem] mt-1 rounded w-full p-2 " placeholder="entrez votre email"  type="text" />
            </div>
            <div>
            <label htmlFor="username">Full Name </label>
            <TextInput   onChange={(e:FormEvent<HTMLInputElement> )=> setUsername(e.currentTarget.value)} id="username" className="h-[3rem] mt-1 rounded w-full p-2 " placeholder="entrez votre userName"  type="text" />
            </div>
            
           

            <button  onClick={()=> stepStatus ===1 ? setstepStatus(2) : setstepStatus(1) } type="button"  className="h-[2.8rem] bg-[#3C5AF0] hover:bg-blue-900 font-semibold rounded text-white " >{"Continuer" }</button>

         <p className="text-center text-gray-400 font-semibold">OU</p>
         <div className="h-[3.5rem] flex gap-x-4 justify-center flex-row items-center  " >
            <div className=" h-[3rem] w-[3rem] rounded  shadow hover:shadow-md cursor-pointer items-center justify-center flex  " >
                <FcGoogle />
            </div>
           
            
         </div>
         </div>
         {/* Second Step */}
         <div className={`h-[35rem] w-[23rem] md:w-[30rem] flex shadow drop-shadow-md flex-col gap-y-4  rounded p-5 absolute transition duration-[700ms] ease-in-out delay-[100ms]  ${stepStatus ===1 ? "translate-x-[30rem]" : "translate-x-[0rem]" } bg-white`}>
          <LoadingOverlay visible={isLoading} />
         <div onClick={()=> setstepStatus(1)} className="h-[2.8rem] w-[8rem] bg-[#D2D9F5]   rounded-md items-center gap-x-4 cursor-pointer mt-2 justify-center flex " >
            <BsArrowLeft color="#616EA6" size={20} />
            <p className="text-[#616EA6] font-semibold">retourner</p>
        </div>
        <div>
            <label htmlFor="password">Mot de passe</label>
            <PasswordInput   onChange={(e:FormEvent<HTMLInputElement> )=> setPassword(e.currentTarget.value)} id="password" className="h-[3rem] mt-1 rounded w-full p-2 " placeholder="entrez votre mot de passe"   />
            </div>
            <div>
            <label htmlFor="confirmPassword">Confirmation du Mot de passe</label>
            <PasswordInput   onChange={(e:FormEvent<HTMLInputElement> )=> setConfirmPassword(e.currentTarget.value)} id="confirmPassword" className="h-[3rem] mt-1 rounded w-full p-2 " placeholder="entrez votre mot de passe"   />
            </div>
            <button  onClick={()=> SignupHandler()   } type="button"  className="h-[2.8rem] bg-[#3C5AF0] hover:bg-blue-900 font-semibold rounded text-white " >{ "s'enregistrer"}</button>
         </div>
         
        </div>
        <p className='text-center'>Deja  enregistré ? <Link className='text-blue-400 cursor-pointer ' to="/login"  >se connecter</Link></p>

    </div>)   
}