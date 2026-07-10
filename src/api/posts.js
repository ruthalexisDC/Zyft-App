import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Privacy
export const updatePrivacy = async (isPrivate) => {
  const res = await api.patch("/users/me/privacy", { isPrivate });
  return res.data;
};

// Notification preferences
export const getNotificationPrefs = async () => {
  const res = await api.get("/users/me/notifications");
  return res.data; // { likes: true, comments: true, follows: true }
};

export const updateNotificationPrefs = async (prefs) => {
  const res = await api.patch("/users/me/notifications", prefs);
  return res.data;
};

// ── Post APIs ──
export const getPosts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/posts/feed?${query}` : '/api/posts/feed';
  return api.get(url);
};

export const getPost = (id) => api.get(`/api/posts/${id}`);
export const createPost = (data) => api.post('/api/posts', data);
export const updatePost = (id, data) => api.put(`/api/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/api/posts/${id}`);
export const respectPost = (postId, respected) =>
  api.post(`/api/posts/${postId}/respect`, { respected });
export const getComments = (postId) => api.get(`/api/posts/${postId}/comments`);
export const addComment = (postId, data) =>
  api.post(`/api/posts/${postId}/comments`, data);
export const getUserStats = () => api.get('/api/stats/today');
export const deleteComment = (postId, commentId) =>
  api.delete(`/api/posts/${postId}/comments/${commentId}`);
export const updateComment = (postId, commentId, data) =>
  api.put(`/api/posts/${postId}/comments/${commentId}`, data);
export const reactToComment = (postId, commentId, emoji) =>
  api.post(`/api/posts/${postId}/comments/${commentId}/react`, { emoji });

// ── User Profile APIs ──
export const getUserProfile = (userId) => api.get(`/api/users/id/${userId}`);
export const updateProfile = (data) => api.put('/api/users/profile', data);
export const uploadProfilePhoto = (formData) =>
  api.put('/api/users/avatar', formData);
export const deleteAccount = () => api.delete('/api/users/account');
export const getUserPosts = (userId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/api/users/id/${userId}/posts?${query}`);
};

// ── User / Follow APIs ──
export const getUserByHandle = (handle) => api.get(`/api/users/${handle}`);
export const followUser = (handle) => api.post(`/api/users/${handle}/follow`);
export const followUserById = (userId) => api.post(`/api/users/id/${userId}/follow`);
export const getSuggestedUsers = () => api.get('/api/users/suggested');
export const getUserSplit = (userId) => api.get(`/api/users/${userId}/split`);
export const updateUserSplit = (userId, split) =>
  api.put(`/api/users/${userId}/split`, { split });