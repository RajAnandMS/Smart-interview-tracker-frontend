import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const getMyProfile = () => axios.get(`${API_BASE_URL}/api/users/me`);
export const updateMyProfile = (payload) => axios.put(`${API_BASE_URL}/api/users/me`, payload);
export const changeMyPassword = (payload) => axios.put(`${API_BASE_URL}/api/users/me/password`, payload);
