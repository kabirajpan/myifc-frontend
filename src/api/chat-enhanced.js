import { api } from './client';
import { chatCache, messageCache } from '../utils/cache';

export const chatApi = {
  // Get all chat sessions for current user (with caching)
  getSessions: async (useCache = true) => {
    const cacheKey = 'chat-sessions';
    
    if (useCache) {
      const cached = chatCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached sessions');
        return cached;
      }
    }
    
    const response = await api.get('/api/chat/sessions', { requiresAuth: true });
    chatCache.set(cacheKey, response);
    return response;
  },

  invalidateSessions: () => {
    chatCache.invalidate('chat-sessions');
  },

  createSession: async (otherUserId) => {
    const response = await api.post(
      '/api/chat/sessions',
      { other_user_id: otherUserId },
      { requiresAuth: true }
    );
    chatApi.invalidateSessions();
    return response;
  },

  getMessages: async (sessionId, useCache = true) => {
    const cacheKey = `messages-${sessionId}`;
    
    if (useCache) {
      const cached = messageCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Using cached messages for session ${sessionId}`);
        return cached;
      }
    }
    
    const response = await api.get(`/api/chat/messages/${sessionId}`, {
      requiresAuth: true,
    });
    messageCache.set(cacheKey, response);
    return response;
  },

  invalidateMessages: (sessionId) => {
    messageCache.invalidate(`messages-${sessionId}`);
  },

  // ✅ MERGED: Caption support from chat.js
  sendMessage: async (sessionId, content, type = 'text', replyToId = null, caption = null) => {
    const response = await api.post(
      '/api/chat/messages',
      { 
        session_id: sessionId, 
        content, 
        type,
        reply_to_message_id: replyToId,
        caption: caption
      },
      { requiresAuth: true }
    );
    
    chatApi.invalidateMessages(sessionId);
    chatApi.invalidateSessions();
    return response;
  },

  deleteMessage: async (messageId, sessionId) => {
    const response = await api.delete(
      `/api/chat/messages/${messageId}`,
      { requiresAuth: true }
    );
    
    if (sessionId) {
      chatApi.invalidateMessages(sessionId);
    }
    chatApi.invalidateSessions();
    return response;
  },

  markAsRead: async (sessionId) => {
    const response = await api.put(
      `/api/chat/messages/read/${sessionId}`,
      null,
      { requiresAuth: true }
    );
    chatApi.invalidateSessions();
    return response;
  },

  // ✅ NEW: React to message
  reactToMessage: async (messageId, emoji) => {
    const response = await api.post(
      `/api/chat/messages/${messageId}/react`,
      { emoji },
      { requiresAuth: true }
    );
    return response;
  },

  // ✅ NEW: Remove reaction
  removeReaction: async (messageId, reactionId) => {
    const response = await api.delete(
      `/api/chat/messages/${messageId}/reactions/${reactionId}`,
      { requiresAuth: true }
    );
    return response;
  },

  // ✅ NEW: Report message
  reportMessage: async (messageId, reason, details = null) => {
    const response = await api.post(
      `/api/chat/messages/${messageId}/report`,
      { 
        reason,
        details 
      },
      { requiresAuth: true }
    );
    return response;
  },

  // ✅ NEW: Generate share link
  generateShareLink: async (messageId) => {
    const response = await api.post(
      `/api/chat/messages/${messageId}/share`,
      {},
      { requiresAuth: true }
    );
    return response;
  },
};