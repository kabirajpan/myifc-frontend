import { api } from './client';
import { API_CONFIG } from './config';

export const roomsApi = {
  // Get public rooms (no auth required)
  getPublicRooms: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.GET_PUBLIC_ROOMS, { requiresAuth: false });
  },

  // Get all rooms
  getAllRooms: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.GET_ALL_ROOMS, { requiresAuth: true });
  },

  // Get user's joined rooms
  getUserRooms: async () => {
    return await api.get('/api/rooms/user', { requiresAuth: true });
  },

  // Create room
  createRoom: async (name, description, isAdminRoom = false) => {
    return await api.post(
      API_CONFIG.ENDPOINTS.CREATE_ROOM,
      { name, description, is_admin_room: isAdminRoom },
      { requiresAuth: true }
    );
  },

  // Get room details
  getRoom: async (roomId) => {
    return await api.get(`${API_CONFIG.ENDPOINTS.GET_ROOM}/${roomId}`, { requiresAuth: true });
  },

  // Join room
  joinRoom: async (roomId) => {
    return await api.post(`${API_CONFIG.ENDPOINTS.JOIN_ROOM}/${roomId}/join`, null, { requiresAuth: true });
  },

  // Leave room
  leaveRoom: async (roomId) => {
    return await api.post(`${API_CONFIG.ENDPOINTS.LEAVE_ROOM}/${roomId}/leave`, null, { requiresAuth: true });
  },

  // Send message in room with reply and caption support
  sendMessage: async (roomId, content, type = 'text', replyTo = null, secretTo = null, caption = null) => {
    return await api.post(
      `${API_CONFIG.ENDPOINTS.SEND_ROOM_MESSAGE}/${roomId}/messages`,
      {
        content,
        type,
        reply_to: replyTo,
        secret_to: secretTo,
        caption
      },
      { requiresAuth: true }
    );
  },

  // Get room messages
  getMessages: async (roomId, limit = 100) => {
    return await api.get(
      `${API_CONFIG.ENDPOINTS.GET_ROOM_MESSAGES}/${roomId}/messages?limit=${limit}`,
      { requiresAuth: true }
    );
  },

  // Get room members
  getMembers: async (roomId) => {
    return await api.get(`${API_CONFIG.ENDPOINTS.GET_ROOM_MEMBERS}/${roomId}/members`, { requiresAuth: true });
  },

  // Delete room
  deleteRoom: async (roomId) => {
    return await api.delete(`${API_CONFIG.ENDPOINTS.DELETE_ROOM}/${roomId}`, { requiresAuth: true });
  },

  // Delete room message
  deleteMessage: async (roomId, messageId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.SEND_ROOM_MESSAGE}/${roomId}/messages/${messageId}`,
      { requiresAuth: true }
    );
  },

  // Report room message
  reportMessage: async (roomId, messageId, reason, details) => {
    return await api.post(
      `/api/rooms/${roomId}/messages/${messageId}/report`,
      { reason, details },
      { requiresAuth: true }
    );
  },

  // React to room message
  reactToMessage: async (roomId, messageId, emoji) => {
    return await api.post(
      `${API_CONFIG.ENDPOINTS.SEND_ROOM_MESSAGE}/${roomId}/messages/${messageId}/react`,
      { emoji },
      { requiresAuth: true }
    );
  },

  // Get reactions for room message
  getMessageReactions: async (roomId, messageId) => {
    return await api.get(
      `${API_CONFIG.ENDPOINTS.SEND_ROOM_MESSAGE}/${roomId}/messages/${messageId}/reactions`,
      { requiresAuth: true }
    );
  },

  // Remove reaction from room message
  removeReaction: async (roomId, reactionId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.SEND_ROOM_MESSAGE}/${roomId}/reactions/${reactionId}`,
      { requiresAuth: true }
    );
  },

  // Cleanup expired rooms (admin)
  cleanupExpiredRooms: async () => {
    return await api.post(
      API_CONFIG.ENDPOINTS.CLEANUP_ROOMS,
      null,
      { requiresAuth: true }
    );
  }
};