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

  // Send a message - with reply and caption support
sendMessage: async (sessionId, content, type = 'text', replyToId = null, caption = null) => {
  return await api.post(
    '/api/chat/messages',
    { 
      session_id: sessionId, 
      content, 
      type,
      reply_to_message_id: replyToId,
      caption: caption // ✅ Add caption field
    },
    { requiresAuth: true }
  );
},

  // Delete a message (media only)
  deleteMessage: async (messageId) => {
    return await api.delete(
      `/api/chat/messages/${messageId}`,
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
