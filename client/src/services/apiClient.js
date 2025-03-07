import axios from 'axios';

// Base URL configuration based on environment
const baseURL = process.env.NODE_ENV === 'production'
  ? '/api'  // In production, use relative path (nginx will proxy)
  : 'http://localhost:6789/api';  // In development, use direct server URL

// Create a custom axios instance
const apiClient = axios.create({
  baseURL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable retries for better reliability
  retry: 3,
  retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
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
  async error => {
    const { config, response } = error;

    // Handle retry logic
    if (!response && config && config.retry > 0) {
      config.retry -= 1;
      const delayMs = config.retryDelay(config.retry);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return apiClient(config);
    }

    // Handle specific error cases from our memory
    if (response) {
      switch (response.status) {
        case 429: // Rate limit
          console.error('Rate limit exceeded:', response.data);
          return Promise.reject({
            response: {
              data: {
                message: 'Rate limit exceeded. Please try again later.'
              }
            }
          });
        case 500:
        case 502:
        case 503:
        case 504:
          console.error('Server error:', response.data);
          return Promise.reject({
            response: {
              data: {
                message: 'Server temporarily unavailable. Please try again later.'
              }
            }
          });
      }
    }

    // Handle network errors
    if (!response) {
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
