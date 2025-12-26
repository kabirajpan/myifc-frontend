// Smart detection: use localhost on laptop, IP on phone
const getBaseUrl = () => {
  // Server-side rendering (SSR) - use localhost
  if (typeof window === 'undefined') {
    return import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  // If accessing via localhost, use localhost backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Otherwise use the IP address (for phone/network access)
  return import.meta.env.PUBLIC_API_URL || 'http://10.42.236.108:8000';
};

const getWsUrl = () => {
  // Server-side rendering (SSR)
  if (typeof window === 'undefined') {
    return import.meta.env.PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  }
  
  // If accessing via localhost, use localhost websocket
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8000/ws';
  }
  
  // Otherwise use the IP address
  return import.meta.env.PUBLIC_WS_URL || 'ws://10.42.236.108:8000/ws';
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    // ============================================
    // AUTH ENDPOINTS
    // ============================================
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GUEST_LOGIN: '/api/auth/guest-login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/profile',
    CHECK_USERNAME: '/api/auth/check-username',
    ONLINE_USERS: '/api/auth/online-users',
    DELETE_ACCOUNT: '/api/auth/account',

    // ============================================
    // CHAT ENDPOINTS (Private 1-on-1)
    // ============================================
    CREATE_CHAT_SESSION: '/api/chat/sessions',
    GET_CHAT_SESSIONS: '/api/chat/sessions',
    GET_CHAT_SESSION: '/api/chat/sessions',        // /:sessionId
    SEND_MESSAGE: '/api/chat/messages',
    GET_MESSAGES: '/api/chat/messages',            // /:sessionId
    DELETE_MESSAGE: '/api/chat/messages',          // /:messageId (media only)
    MARK_MESSAGES_READ: '/api/chat/messages/read', // /:sessionId
    CLEANUP_OLD_CHATS: '/api/chat/cleanup',

    // ============================================
    // FRIEND ENDPOINTS
    // ============================================
    SEND_FRIEND_REQUEST: '/api/friends/request',
    ACCEPT_FRIEND: '/api/friends/accept',
    REJECT_FRIEND: '/api/friends/reject',
    BLOCK_USER: '/api/friends/block',
    UNBLOCK_USER: '/api/friends/unblock',
    GET_FRIENDS: '/api/friends',
    PENDING_REQUESTS: '/api/friends/requests/pending',
    SENT_REQUESTS: '/api/friends/requests/sent',
    BLOCKED_USERS: '/api/friends/blocked',
    FRIENDSHIP_STATUS: '/api/friends/status',

    // ============================================
    // ROOM ENDPOINTS
    // ============================================
    // Room Management
    GET_PUBLIC_ROOMS: '/api/rooms/public',
    GET_ALL_ROOMS: '/api/rooms',
    CREATE_ROOM: '/api/rooms',
    GET_ROOM: '/api/rooms',                        // /:roomId
    DELETE_ROOM: '/api/rooms',                     // /:roomId
    CLEANUP_EXPIRED_ROOMS: '/api/rooms/cleanup/expired',
    
    // Room Membership
    JOIN_ROOM: '/api/rooms',                       // /:roomId/join
    LEAVE_ROOM: '/api/rooms',                      // /:roomId/leave
    GET_ROOM_MEMBERS: '/api/rooms',                // /:roomId/members
    
    // Room Messages
    SEND_ROOM_MESSAGE: '/api/rooms',               // /:roomId/messages
    GET_ROOM_MESSAGES: '/api/rooms',               // /:roomId/messages
    
    // Room Message Reactions (NEW)
    REACT_TO_ROOM_MESSAGE: '/api/rooms',           // /:roomId/messages/:messageId/react
    GET_ROOM_MESSAGE_REACTIONS: '/api/rooms',      // /:roomId/messages/:messageId/reactions
    REMOVE_ROOM_REACTION: '/api/rooms',            // /:roomId/reactions/:reactionId

    // ============================================
    // MEDIA ENDPOINTS
    // ============================================
    UPLOAD_IMAGE: '/api/media/upload/image',
    UPLOAD_GIF: '/api/media/upload/gif',
    UPLOAD_AUDIO: '/api/media/upload/audio',
    DELETE_MEDIA: '/api/media',                    // /:publicId

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================
    // Dashboard
    ADMIN_STATS: '/api/admin/stats',
    
    // User Management
    ADMIN_USERS: '/api/admin/users',
    ADMIN_USER_DETAILS: '/api/admin/users',        // /:userId
    ADMIN_BAN_USER: '/api/admin/users',            // /:userId/ban
    ADMIN_UNBAN_USER: '/api/admin/users',          // /:userId/unban
    ADMIN_DELETE_USER: '/api/admin/users',         // /:userId
    ADMIN_PROMOTE_USER: '/api/admin/users',        // /:userId/promote
    ADMIN_DEMOTE_USER: '/api/admin/users',         // /:userId/demote
    
    // Chat Management
    ADMIN_CHATS: '/api/admin/chats',
    ADMIN_CHAT_MESSAGES: '/api/admin/chats',       // /:sessionId/messages
    ADMIN_DELETE_MESSAGE: '/api/admin/messages',   // /:messageId
    ADMIN_DELETE_CHAT: '/api/admin/chats',         // /:sessionId
    
    // Room Management
    ADMIN_ROOMS: '/api/admin/rooms',
    ADMIN_ROOM_DETAILS: '/api/admin/rooms',        // /:roomId
    ADMIN_CREATE_ROOM: '/api/admin/rooms',
    ADMIN_UPDATE_ROOM: '/api/admin/rooms',         // /:roomId
    ADMIN_DELETE_ROOM: '/api/admin/rooms',         // /:roomId
    ADMIN_KICK_USER: '/api/admin/rooms',           // /:roomId/kick/:userId
    ADMIN_DELETE_ROOM_MESSAGE: '/api/admin/room-messages', // /:messageId
  },
  TIMEOUT: 30000, // 30 seconds
};

// WebSocket configuration
export const WS_CONFIG = {
  URL: getWsUrl(),
  RECONNECT_INTERVAL: 2000,      // Start with 2s delay
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,          // Send ping every 30s to keep connection alive
};

// WebSocket Event Types (for type safety and consistency)
export const WS_EVENTS = {
  // Client -> Server
  AUTH: 'auth',
  PING: 'ping',
  
  // Server -> Client
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  PONG: 'pong',
  
  // Messages
  NEW_MESSAGE: 'new_message',
  
  // Reactions
  MESSAGE_REACTED: 'message_reacted',
  REACTION_REMOVED: 'reaction_removed',
  
  // Room Presence
  ROOM_PRESENCE: 'room_presence',
  USER_JOINED_ROOM: 'user_joined_room',
  USER_LEFT_ROOM: 'user_left_room',
  
  // Chat Status
  TYPING: 'typing',
  ONLINE_STATUS: 'online_status',
};

// Export utility to build full URLs
export const buildUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Export utility for query strings
export const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return queryString ? `?${queryString}` : '';
};