// src/api/interactions.js
import axios from 'axios';
import { API_ORIGIN } from '../config';

//const API_URL = 'http://localhost:5000/api/posts';
const API_URL = `${API_ORIGIN}/api/posts`;

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// ── Favorites ──
export const savePost = (postId) => 
  axios.post(`${API_URL}/${postId}/save`, {}, authHeaders());

export const unsavePost = (postId) => 
  axios.delete(`${API_URL}/${postId}/save`, authHeaders());

// ── Hide / Not Interested ──
export const hidePost = (postId) => 
  axios.post(`${API_URL}/${postId}/hide`, {}, authHeaders());

export const unhidePost = (postId) => 
  axios.delete(`${API_URL}/${postId}/hide`, authHeaders());

// ── Report ──
export const reportPost = (postId, reason) => 
  axios.post(`${API_URL}/${postId}/report`, { reason }, authHeaders());

// ── Share tracking ──
export const trackShare = (postId, platform) => 
  axios.post(`${API_URL}/${postId}/share`, { platform }, authHeaders());