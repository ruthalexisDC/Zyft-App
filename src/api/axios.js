// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Attach JWT token to every request automatically
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api; 

// src/api/axios.js
import axios from 'axios';
import { API_ORIGIN } from '../config';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests — EXCEPT login/register
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Skip auth header for public endpoints
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;