import { api } from './client';
import { API_CONFIG } from './config';

export const roomsApi = {
    // Get public rooms (no auth required)
  getPublicRooms: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.GET_PUBLIC_ROOMS, { requiresAuth: false });
  },
  
  // Get all rooms
  getAllRooms: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.GET_ROOMS, { requiresAuth: true });
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

 // Send message in room
sendMessage: async (roomId, content, type = 'text', recipientId = null) => {
  return await api.post(
    `${API_CONFIG.ENDPOINTS.SEND_ROOM_MESSAGE}/${roomId}/messages`,
    { content, type, recipient_id: recipientId },
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
};
