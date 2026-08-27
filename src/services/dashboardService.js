import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const getDashboard = () => axios.get(`${API_BASE_URL}/api/dashboard`);
