import axios from "axios"

 
export const apiUrl ="https://meetcloneback.onrender.com"
// export const apiUrl ="http://127.0.0.1:3000"
export const frontendUrl ="https://mygooglemeet.netlify.app"
// export const frontendUrl ="http://127.0.0.1:5173"

const  httpClient = axios.create( {
    baseURL: "https://meetcloneback.onrender.com/api"
})


export default httpClient