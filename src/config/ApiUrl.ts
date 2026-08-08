import axios from "axios";

const PROD_URL = import.meta.env.VITE_BACKEND_URL;
export const apiUrl =
  import.meta.env.PROD && PROD_URL ? PROD_URL : "http://127.0.0.1:3000";
export const frontendUrl = import.meta.env.PROD
  ? window.location.origin
  : "http://127.0.0.1:5173";

const httpClient = axios.create({
  baseURL: `${apiUrl}/api`,
});

export default httpClient;
