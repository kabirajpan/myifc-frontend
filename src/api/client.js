import { API_CONFIG } from './config';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get auth token from localStorage
 */
export const getToken = () => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Set auth token in localStorage
 */
export const setToken = (token) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('token', token);
};

/**
 * Remove auth token from localStorage
 */
export const removeToken = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Main API request function
 */
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = false,
    timeout = API_CONFIG.TIMEOUT,
  } = options;

  // Build URL
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  // Build headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build request options
  const requestOptions = {
    method,
    headers: requestHeaders,
  };

  // Add body if present
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();

    // Handle non-OK responses
    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, null);
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiError('Network error. Please check your connection.', 0, null);
    }

    // Re-throw ApiError
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    throw new ApiError('An unexpected error occurred', 500, null);
  }
};

/**
 * Helper functions for common HTTP methods
 */
export const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'PUT', body }),

  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
