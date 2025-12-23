import axios from "axios";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true, 
  timeout: 0,            
});