import { api } from './client';
import { API_CONFIG } from './config';

export const adminApi = {
  // ==================== DASHBOARD ====================
  getStats: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.ADMIN_STATS, {
      requiresAuth: true,
    });
  },

  // ==================== USER MANAGEMENT ====================
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params 
      ? `${API_CONFIG.ENDPOINTS.ADMIN_USERS}?${params}`
      : API_CONFIG.ENDPOINTS.ADMIN_USERS;
    
    return await api.get(endpoint, { requiresAuth: true });
  },

  getUserDetails: async (userId) => {
    return await api.get(
      `${API_CONFIG.ENDPOINTS.ADMIN_USER_DETAILS}/${userId}`,
      { requiresAuth: true }
    );
  },

  banUser: async (userId, durationDays, reason) => {
    return await api.post(
      `${API_CONFIG.ENDPOINTS.ADMIN_BAN_USER}/${userId}/ban`,
      { duration_days: durationDays, reason },
      { requiresAuth: true }
    );
  },

  unbanUser: async (userId) => {
    return await api.post(
      `${API_CONFIG.ENDPOINTS.ADMIN_UNBAN_USER}/${userId}/unban`,
      null,
      { requiresAuth: true }
    );
  },

  deleteUser: async (userId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.ADMIN_DELETE_USER}/${userId}`,
      { requiresAuth: true }
    );
  },

  promoteUser: async (userId, role) => {
    return await api.post(
      `${API_CONFIG.ENDPOINTS.ADMIN_PROMOTE_USER}/${userId}/promote`,
      { role },
      { requiresAuth: true }
    );
  },

  demoteUser: async (userId) => {
    return await api.post(
      `${API_CONFIG.ENDPOINTS.ADMIN_DEMOTE_USER}/${userId}/demote`,
      null,
      { requiresAuth: true }
    );
  },

  // ==================== CHAT MODERATION ====================
  getChats: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.ADMIN_CHATS, {
      requiresAuth: true,
    });
  },

  getChatMessages: async (sessionId) => {
    return await api.get(
      `${API_CONFIG.ENDPOINTS.ADMIN_CHAT_MESSAGES}/${sessionId}/messages`,
      { requiresAuth: true }
    );
  },

  deleteMessage: async (messageId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.ADMIN_DELETE_MESSAGE}/${messageId}`,
      { requiresAuth: true }
    );
  },

  deleteChat: async (sessionId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.ADMIN_DELETE_CHAT}/${sessionId}`,
      { requiresAuth: true }
    );
  },

  // ==================== ROOM MANAGEMENT ====================
  getRooms: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.ADMIN_ROOMS, {
      requiresAuth: true,
    });
  },

  getRoomDetails: async (roomId) => {
    return await api.get(
      `${API_CONFIG.ENDPOINTS.ADMIN_ROOM_DETAILS}/${roomId}`,
      { requiresAuth: true }
    );
  },

  createRoom: async (name, description) => {
    return await api.post(
      API_CONFIG.ENDPOINTS.ADMIN_CREATE_ROOM,
      { name, description },
      { requiresAuth: true }
    );
  },

  updateRoom: async (roomId, updates) => {
    return await api.put(
      `${API_CONFIG.ENDPOINTS.ADMIN_UPDATE_ROOM}/${roomId}`,
      updates,
      { requiresAuth: true }
    );
  },

  deleteRoom: async (roomId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.ADMIN_DELETE_ROOM}/${roomId}`,
      { requiresAuth: true }
    );
  },

  kickUserFromRoom: async (roomId, userId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.ADMIN_KICK_USER}/${roomId}/members/${userId}`,
      { requiresAuth: true }
    );
  },

  deleteRoomMessage: async (messageId) => {
    return await api.delete(
      `${API_CONFIG.ENDPOINTS.ADMIN_DELETE_ROOM_MESSAGE}/${messageId}`,
      { requiresAuth: true }
    );
  },
};
