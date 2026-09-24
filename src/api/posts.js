// src/api/posts.js
import api from './axios';

// ── Privacy ──

// posts.js
export const updatePrivacy = (isPrivate) =>
  api.patch('/users/privacy', { isPrivate }).then(res => res.data);

// ── Notification preferences ──
export const getNotificationPrefs = () =>
  api.get('/users/notification-preferences').then(res => res.data);

export const updateNotificationPrefs = (prefs) =>
  api.patch('/users/notification-preferences', prefs).then(res => res.data);

// ── Post APIs ──
export const getPosts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/posts/feed?${query}` : '/posts/feed';
  return api.get(url);
};

export const getSavedPosts = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return api.get(
    query
      ? `/posts/saved?${query}`
      : '/posts/saved'
  );
};

export const getPost = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.patch(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const respectPost = (postId, respected) =>
  api.post(`/posts/${postId}/respect`, { respected });
export const getComments = (postId) => api.get(`/posts/${postId}/comments`);
export const addComment = (postId, data) =>
  api.post(`/posts/${postId}/comments`, data);
export const deleteComment = (postId, commentId) =>
  api.delete(`/posts/${postId}/comments/${commentId}`);
export const updateComment = (postId, commentId, data) =>
  api.patch(`/posts/${postId}/comments/${commentId}`, data);
export const reactToComment = (postId, commentId, emoji) =>
  api.post(`/posts/${postId}/comments/${commentId}/react`, { emoji });

// ── User Profile APIs ──
export const getUserProfile = (userId) => api.get(`/users/id/${userId}`);
export const updateProfile = (data) => api.patch('/users/profile', data);
export const uploadProfilePhoto = (formData) =>
  api.patch('/users/avatar', formData);
export const deleteAccount = () => api.delete('/users/account');
export const getUserPosts = (userId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/users/id/${userId}/posts?${query}`);
};

// ── User / Follow APIs ──
export const getUserByHandle = (handle) => api.get(`/users/${handle}`);
export const followUser = (handle) => api.post(`/users/${handle}/follow`);
export const followUserById = (userId) => api.post(`/users/id/${userId}/follow`);
export const getSuggestedUsers = () => api.get('/users/suggested');
export const getUserSplit = (userId) => api.get(`/users/${userId}/split`);
export const updateUserSplit = (userId, split) =>
  api.patch(`/users/${userId}/split`, { split });
