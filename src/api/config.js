// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.PUBLIC_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GUEST_LOGIN: '/api/auth/guest-login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/profile',
    CHECK_USERNAME: '/api/auth/check-username',
    ONLINE_USERS: '/api/auth/online-users',
    DELETE_ACCOUNT: '/api/auth/account',
    
    // Chat endpoints
    SEND_MESSAGE: '/api/chat/send',
    GET_MESSAGES: '/api/chat/messages',
    GET_CHATS: '/api/chat/sessions',
    
    // Friend endpoints
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
    
    // Room endpoints
    GET_PUBLIC_ROOMS: '/api/rooms/public', 
    GET_ROOMS: '/api/rooms',
    CREATE_ROOM: '/api/rooms',
    GET_ROOM: '/api/rooms',
    JOIN_ROOM: '/api/rooms',
    LEAVE_ROOM: '/api/rooms',
    SEND_ROOM_MESSAGE: '/api/rooms',
    GET_ROOM_MESSAGES: '/api/rooms',
    GET_ROOM_MEMBERS: '/api/rooms',
    DELETE_ROOM: '/api/rooms',
    CLEANUP_ROOMS: '/api/rooms/cleanup/expired',
    
    // Admin endpoints
    ADMIN_STATS: '/api/admin/stats',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_USER_DETAILS: '/api/admin/users',
    ADMIN_BAN_USER: '/api/admin/users',
    ADMIN_UNBAN_USER: '/api/admin/users',
    ADMIN_DELETE_USER: '/api/admin/users',
    ADMIN_PROMOTE_USER: '/api/admin/users',
    ADMIN_DEMOTE_USER: '/api/admin/users',
    ADMIN_CHATS: '/api/admin/chats',
    ADMIN_CHAT_MESSAGES: '/api/admin/chats',
    ADMIN_DELETE_MESSAGE: '/api/admin/messages',
    ADMIN_DELETE_CHAT: '/api/admin/chats',
    ADMIN_ROOMS: '/api/admin/rooms',
    ADMIN_ROOM_DETAILS: '/api/admin/rooms',
    ADMIN_CREATE_ROOM: '/api/admin/rooms',
    ADMIN_UPDATE_ROOM: '/api/admin/rooms',
    ADMIN_DELETE_ROOM: '/api/admin/rooms',
    ADMIN_KICK_USER: '/api/admin/rooms',
    ADMIN_DELETE_ROOM_MESSAGE: '/api/admin/room-messages',
  },
  TIMEOUT: 30000, // 30 seconds
};

// WebSocket configuration
export const WS_CONFIG = {
  URL: import.meta.env.PUBLIC_WS_URL || 'ws://localhost:8000/ws',
};
