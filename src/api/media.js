import { API_CONFIG } from './config';
import { getToken } from './client';
import { ApiError } from './client';

/**
 * Upload media file (image, gif, or audio)
 * Special handling for multipart/form-data
 */
const uploadMedia = async (file, mediaType) => {
  const url = `${API_CONFIG.BASE_URL}/api/media/upload`;

  console.log('uploadMedia called:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    mediaType: mediaType
  });

  // Validate file exists
  if (!file || !(file instanceof File)) {
    console.error('Invalid file object:', file);
    throw new ApiError('Invalid file object', 400, null);
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', mediaType); // 'image', 'gif', or 'audio'

  // Debug: Log FormData contents
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  // Get auth token
  const token = getToken();
  if (!token) {
    throw new ApiError('Authentication required', 401, null);
  }

  try {
    console.log('Sending request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DON'T set Content-Type - browser will set it with boundary
      },
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Upload failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
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
    console.log('uploadImage called with:', file);
    return await uploadMedia(file, 'image');
  },

  // Upload GIF
  uploadGif: async (file) => {
    console.log('uploadGif called with:', file);
    return await uploadMedia(file, 'gif');
  },

  // Upload audio
  uploadAudio: async (file) => {
    console.log('uploadAudio called with:', file);
    return await uploadMedia(file, 'audio');
  },
};