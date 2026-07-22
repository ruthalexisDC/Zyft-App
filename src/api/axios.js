
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
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/verify-email/confirm', '/auth/reset-password'];
  const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;