
// src/api/notifications.js

import api from "./axios";

// Get all notifications for the logged-in user.
export const getNotification = async () => {
  const response = await api.get("/notifications");
  return response.data.data;
};

// Get unread notification count.
export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data.data.count;
};

// Mark one notification as read.
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

// Mark all notifications as read.
export const markAllNotificationAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data.data;
};

// Delete one notification.
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};