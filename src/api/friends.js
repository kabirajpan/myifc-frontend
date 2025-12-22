import { api } from './client';
import { API_CONFIG } from './config';

export const friendsApi = {
  // Send friend request
  sendRequest: async (recipientId) => {
    return await api.post(API_CONFIG.ENDPOINTS.SEND_FRIEND_REQUEST, 
      { recipient_id: recipientId }, 
      { requiresAuth: true }
    );
  },

  // Accept friend request
  acceptRequest: async (friendshipId) => {
    return await api.post(`${API_CONFIG.ENDPOINTS.ACCEPT_FRIEND}/${friendshipId}`, 
      null, 
      { requiresAuth: true }
    );
  },

  // Reject friend request
  rejectRequest: async (friendshipId) => {
    return await api.post(`${API_CONFIG.ENDPOINTS.REJECT_FRIEND}/${friendshipId}`, 
      null, 
      { requiresAuth: true }
    );
  },

  // Block user
  blockUser: async (userId) => {
    return await api.post(API_CONFIG.ENDPOINTS.BLOCK_USER, 
      { user_id: userId }, 
      { requiresAuth: true }
    );
  },

  // Unblock user
  unblockUser: async (userId) => {
    return await api.post(`${API_CONFIG.ENDPOINTS.UNBLOCK_USER}/${userId}`, 
      null, 
      { requiresAuth: true }
    );
  },

  // Get all friends
  getFriends: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.GET_FRIENDS, { requiresAuth: true });
  },

  // Get pending requests (received)
  getPendingRequests: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.PENDING_REQUESTS, { requiresAuth: true });
  },

  // Get sent requests
  getSentRequests: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.SENT_REQUESTS, { requiresAuth: true });
  },

  // Get blocked users
  getBlockedUsers: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.BLOCKED_USERS, { requiresAuth: true });
  },

  // Check friendship status
  checkStatus: async (userId) => {
    return await api.get(`${API_CONFIG.ENDPOINTS.FRIENDSHIP_STATUS}/${userId}`, 
      { requiresAuth: true }
    );
  }
};
