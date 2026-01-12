import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = 'https://ems-metro-f-and-b-production.up.railway.app/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }

    // Global error popup handling
    // Display backend error messages in a popup window
    // Components can opt-out by adding { skipGlobalError: true } to config
    const skipGlobalError = error.config?.skipGlobalError;

    if (!skipGlobalError) {
      if (error.response?.data?.message) {
        // Don't show alert for silent failures (like getToday which handles its own errors)
        const isSilentRequest = error.config?.url?.includes('/employee/attendance/today');
        if (!isSilentRequest) {
          alert(error.response.data.message);
        }
      } else if (error.message && !error.response) {
        // Network or other errors (only if there's no response from server)
        alert('Network error: ' + error.message);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
