import axios from "axios";
const API_BASE_URL=import.meta.env.VITE_API_BASE_URL||"http://localhost:8080";
export const analyzeResume=(file,onUploadProgress)=>{
 const form=new FormData(); form.append("file",file);
 return axios.post(`${API_BASE_URL}/api/resumes/analyze`,form,{onUploadProgress});
};
export const getResumeHistory=()=>axios.get(`${API_BASE_URL}/api/resumes/history`);
export const getResumeAnalysis=(id)=>axios.get(`${API_BASE_URL}/api/resumes/${id}`);
export const deleteResumeAnalysis=(id)=>axios.delete(`${API_BASE_URL}/api/resumes/${id}`);
