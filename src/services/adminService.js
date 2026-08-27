import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const getAdminStats = () =>
  axios.get(`${API_BASE_URL}/api/admin/stats`);

export const getAdminUsers = () =>
  axios.get(`${API_BASE_URL}/api/admin/users`);
