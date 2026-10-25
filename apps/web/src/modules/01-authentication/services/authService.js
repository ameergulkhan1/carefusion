import api from '../../../utils/api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const tokens = response.data?.data?.tokens;
    const user = response.data?.data?.user;

    if (tokens?.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
    } else if (response.data?.token) {
      // Backward compatibility for older auth payload shape.
      localStorage.setItem('accessToken', response.data.token);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
};

export default authService;