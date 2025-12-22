import { api, setToken, removeToken } from './client';
import { API_CONFIG } from './config';

export const authApi = {
  login: async (usernameOrEmail, password) => {
    const data = await api.post(API_CONFIG.ENDPOINTS.LOGIN, {
      usernameOrEmail,
      password,
    });

    if (data.token) {
      setToken(data.token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }

    return data;
  },

  register: async (userData) => {
    const data = await api.post(API_CONFIG.ENDPOINTS.REGISTER, userData);

    if (data.token) {
      setToken(data.token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }

    return data;
  },

  guestLogin: async (username, gender, age) => {
    const data = await api.post(API_CONFIG.ENDPOINTS.GUEST_LOGIN, {
      username,
      gender,
      age,
    });

    if (data.token) {
      setToken(data.token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }

    return data;
  },

  logout: async () => {
    try {
      await api.post(API_CONFIG.ENDPOINTS.LOGOUT, null, { requiresAuth: true });
    } finally {
      removeToken();
    }
  },

  me: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.ME, { requiresAuth: true });
  },

  updateProfile: async (profileData) => {
    return await api.put(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, profileData, {
      requiresAuth: true,
    });
  },

  checkUsername: async (username) => {
    return await api.get(`${API_CONFIG.ENDPOINTS.CHECK_USERNAME}/${username}`);
  },

  getOnlineUsers: async () => {
    return await api.get(API_CONFIG.ENDPOINTS.ONLINE_USERS, {
      requiresAuth: true,
    });
  },

  deleteAccount: async () => {
    await api.delete(API_CONFIG.ENDPOINTS.DELETE_ACCOUNT, {
      requiresAuth: true,
    });
    removeToken();
  },
};
