import axios from "axios";

export const apiUrl = "https://meetcloneback.onrender.com";
// export const apiUrl = "http://127.0.0.1:3000";
export const frontendUrl = process.env.NODE_ENV === 'production'
  ? "https://mygooglemeet.netlify.app"
  : "http://127.0.0.1:5173";
// export const frontendUrl ="http://127.0.0.1:5173"

const httpClient = axios.create({
  baseURL: `${apiUrl}/api`,
});

export default httpClient;
