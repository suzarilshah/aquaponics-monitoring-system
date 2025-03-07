import axios from 'axios';

// Create a custom axios instance
const apiClient = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Remove auth headers in development mode to avoid CORS issues
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(config => {
    // Remove auth headers in development
    if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  });
}

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        response: {
          data: {
            message: 'Network error. Please check your connection.'
          }
        }
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
