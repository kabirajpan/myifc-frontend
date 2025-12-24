import { api } from './client';
import { chatCache, messageCache } from '../utils/cache';

export const chatApi = {
  // Get all chat sessions for current user (with caching)
  getSessions: async (useCache = true) => {
    const cacheKey = 'chat-sessions';
    
    // Try cache first
    if (useCache) {
      const cached = chatCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached sessions');
        return cached;
      }
    }

    // Fetch from API
    const response = await api.get('/api/chat/sessions', { requiresAuth: true });
    
    // Cache the result
    chatCache.set(cacheKey, response);
    
    return response;
  },

  // Invalidate sessions cache (call after new message, etc.)
  invalidateSessions: () => {
    chatCache.invalidate('chat-sessions');
  },

  // Create or get chat session with another user
  createSession: async (otherUserId) => {
    const response = await api.post(
      '/api/chat/sessions',
      { other_user_id: otherUserId },
      { requiresAuth: true }
    );
    
    // Invalidate sessions cache since we created/accessed a session
    chatApi.invalidateSessions();
    
    return response;
  },

  // Get messages in a chat session (with caching)
  getMessages: async (sessionId, useCache = true) => {
    const cacheKey = `messages-${sessionId}`;
    
    // Try cache first
    if (useCache) {
      const cached = messageCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Using cached messages for session ${sessionId}`);
        return cached;
      }
    }

    // Fetch from API
    const response = await api.get(`/api/chat/messages/${sessionId}`, {
      requiresAuth: true,
    });
    
    // Cache the result
    messageCache.set(cacheKey, response);
    
    return response;
  },

  // Invalidate message cache for a session
  invalidateMessages: (sessionId) => {
    messageCache.invalidate(`messages-${sessionId}`);
  },

  // Send a message - with reply support
  sendMessage: async (sessionId, content, type = 'text', replyToId = null) => {
    const response = await api.post(
      '/api/chat/messages',
      { 
        session_id: sessionId, 
        content, 
        type,
        reply_to_message_id: replyToId
      },
      { requiresAuth: true }
    );
    
    // Invalidate caches since we sent a new message
    chatApi.invalidateMessages(sessionId);
    chatApi.invalidateSessions();
    
    return response;
  },

  // Delete a message (media only)
  deleteMessage: async (messageId, sessionId) => {
    const response = await api.delete(
      `/api/chat/messages/${messageId}`,
      { requiresAuth: true }
    );
    
    // Invalidate caches
    if (sessionId) {
      chatApi.invalidateMessages(sessionId);
    }
    chatApi.invalidateSessions();
    
    return response;
  },

  // Mark messages as read
  markAsRead: async (sessionId) => {
    const response = await api.put(
      `/api/chat/messages/read/${sessionId}`,
      null,
      { requiresAuth: true }
    );
    
    // Invalidate session cache to update unread count
    chatApi.invalidateSessions();
    
    return response;
  },
};
