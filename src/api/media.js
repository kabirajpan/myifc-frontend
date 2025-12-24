import { API_CONFIG } from './config';
import { getToken } from './client';
import { ApiError } from './client';

/**
 * Upload media file (image, gif, or audio)
 * Special handling for multipart/form-data
 */
const uploadMedia = async (file, mediaType) => {
  const url = `${API_CONFIG.BASE_URL}/api/media/upload`;
  
  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', mediaType); // 'image', 'gif', or 'audio'
  
  // Get auth token
  const token = getToken();
  if (!token) {
    throw new ApiError('Authentication required', 401, null);
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DON'T set Content-Type - browser will set it with boundary
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(
        data.error || 'Upload failed',
        response.status,
        data
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload media', 500, null);
  }
};

/**
 * Media API
 */
export const mediaApi = {
  // Upload image
  uploadImage: async (file) => {
    return await uploadMedia(file, 'image');
  },
  
  // Upload GIF
  uploadGif: async (file) => {
    return await uploadMedia(file, 'gif');
  },
  
  // Upload audio
  uploadAudio: async (file) => {
    return await uploadMedia(file, 'audio');
  },
};
