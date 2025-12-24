// Gender colors for text
export const GENDER_COLORS = {
  male: "text-blue-600",
  female: "text-pink-600",
  lesbian: "text-green-400",
  gay: "text-gray-600",
  default: "text-gray-600"
};

// Gender colors for borders
export const GENDER_BORDER_COLORS = {
  male: "#2563eb",
  female: "#db2777",
  lesbian: "#4ade80",
  gay: "#4b5563",
  default: "#9ca3af"
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  GIF: 'gif',
  AUDIO: 'audio'
};

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  NEW_MESSAGE: 'new_message',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  MESSAGE_READ: 'message_read',
};
