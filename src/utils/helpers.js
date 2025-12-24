import { GENDER_COLORS, GENDER_BORDER_COLORS } from './constants';

/**
 * Get text color class based on gender
 */
export const getGenderColor = (gender) => {
  return GENDER_COLORS[gender?.toLowerCase()] || GENDER_COLORS.default;
};

/**
 * Get border color hex value based on gender
 */
export const getGenderBorderColor = (gender) => {
  return GENDER_BORDER_COLORS[gender?.toLowerCase()] || GENDER_BORDER_COLORS.default;
};

/**
 * Format timestamp to time string (HH:MM)
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Format timestamp to date string
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

/**
 * Format relative time (e.g., "2m ago", "3h ago")
 */
export const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate unique temporary ID
 */
export const generateTempId = () => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if message is media type
 */
export const isMediaMessage = (type) => {
  return ['image', 'gif', 'audio'].includes(type);
};

/**
 * Get initials from username
 */
export const getInitials = (username) => {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
};
