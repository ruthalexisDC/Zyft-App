// src/api/auth.js
const API_URL = "http://localhost:5000/api/auth";
import axios from 'axios';

// src/api/auth.js
import api from './axios';

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

export const requestPasswordReset = async ({ email }) => {
  return axios.post(`${API_URL}/auth/forgot-password`, { email });
};

export const registerEmail = async (userData) => {
  const res = await fetch(`${API_URL}/register/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};

export const loginEmail = async (credentials) => {
  const res = await fetch(`${API_URL}/login/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
};