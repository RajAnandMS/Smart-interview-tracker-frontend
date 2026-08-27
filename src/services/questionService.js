import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const API = `${API_BASE_URL}/api/questions`;

export const getQuestions = (params = {}) =>
  axios.get(API, { params });

export const createQuestion = (question) =>
  axios.post(API, question);

export const updateQuestion = (id, question) =>
  axios.put(`${API}/${id}`, question);

export const deleteQuestion = (id) =>
  axios.delete(`${API}/${id}`);