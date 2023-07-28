import axios from "axios"

 
export const apiUrl ="http://127.0.0.1:3000"

const  httpClient = axios.create( {
    baseURL: "http://127.0.0.1:3000/api"
})


export default httpClient