import axios from "axios";
const PROD_URL = import.meta.env.VITE_BACKEND_URL;
export const apiUrl =
  process.env.NODE_ENV === "production" ? PROD_URL : "http://127.0.0.1:3000";
export const frontendUrl =
  process.env.NODE_ENV === "production"
    ? "https://mygooglemeet.netlify.app"
    : "http://127.0.0.1:5173";

const httpClient = axios.create({
  baseURL: `${apiUrl}/api`,
});

export default httpClient;
