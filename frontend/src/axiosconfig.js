import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Function to refresh the admin access token
const refreshAdminToken = async () => {
  try {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await axios.post('http://localhost:8000/refresh', {
      refresh_token: refreshToken,
    });
    const newAccessToken = response.data.access_token;
    localStorage.setItem('admin_access_token', newAccessToken);
    return newAccessToken;
  } catch (err) {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    // Cannot use useNavigate here; rely on components to handle redirect
    throw err;
  }
};

// Set up Axios interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== 'http://localhost:8000/admin/login' &&
      originalRequest.url !== 'http://localhost:8000/refresh'
    ) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAdminToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Components will handle redirect to /admin/login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axios;