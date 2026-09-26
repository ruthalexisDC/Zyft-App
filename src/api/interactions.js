// src/api/interactions.js
import api from './axios';

// ── Favorites ──
export const savePost = (postId) =>
  api.post(`/posts/${postId}/save`);

export const unsavePost = (postId) =>
  api.delete(`/posts/${postId}/save`);

// ── Hide / Not Interested ──
export const hidePost = (postId) =>
  api.post(`/posts/${postId}/hide`);

export const unhidePost = (postId) =>
  api.delete(`/posts/${postId}/hide`);

// ── Report ──
export const reportPost = (postId, reason) =>
  api.post(`/posts/${postId}/report`, { reason });

// ── Share tracking ──
export const trackShare = (postId, platform) =>
  api.post(`/posts/${postId}/share`, { platform });