import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const startInterview = (technology) =>
  axios.post(`${API_BASE_URL}/api/interviews/start`, { technology });

export const completeInterview = (id, payload) =>
  axios.post(`${API_BASE_URL}/api/interviews/${id}/complete`, payload);

export const getInterviewHistory = (technology = "All") =>
  axios.get(`${API_BASE_URL}/api/interviews/history`, {
    params: technology && technology !== "All" ? { technology } : {},
  });

export const getInterview = (id) =>
  axios.get(`${API_BASE_URL}/api/interviews/${id}`);
