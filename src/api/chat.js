import { api } from './client';

export const chatApi = {
  // Get all chat sessions for current user
  getSessions: async () => {
    return await api.get('/api/chat/sessions', { requiresAuth: true });
  },

  // Create or get chat session with another user
  createSession: async (otherUserId) => {
    return await api.post(
      '/api/chat/sessions',
      { other_user_id: otherUserId },
      { requiresAuth: true }
    );
  },

  // Get messages in a chat session
  getMessages: async (sessionId) => {
    return await api.get(`/api/chat/messages/${sessionId}`, {
      requiresAuth: true,
    });
  },

  // Send a message
  sendMessage: async (sessionId, content, type = 'text') => {
    return await api.post(
      '/api/chat/messages',
      { session_id: sessionId, content, type },
      { requiresAuth: true }
    );
  },

  // Mark messages as read
  markAsRead: async (sessionId) => {
    return await api.put(
      `/api/chat/messages/read/${sessionId}`,
      null,
      { requiresAuth: true }
    );
  },
};
