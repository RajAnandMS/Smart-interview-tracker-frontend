import axios from "axios";

const API = "http://localhost:8080/api/questions";

export const getQuestions = () => axios.get(API);

export const createQuestion = (question) =>
    axios.post(API, question);

export const updateQuestion = (id, question) =>
    axios.put(`${API}/${id}`, question);

export const deleteQuestion = (id) =>
    axios.delete(`${API}/${id}`);