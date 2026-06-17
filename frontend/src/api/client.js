import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to uniformly handle backend errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Determine the error message
    let message = 'An unexpected error occurred.';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.data && error.response.data.detail) {
        // FastAPI returns `detail` string or array for validation errors
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map(err => err.msg).join(', ');
        }
      } else {
        message = `Server Error: ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      message = 'Network error. Please check your connection.';
    } else {
      // Something happened in setting up the request
      message = error.message;
    }

    // Show a toast notification
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });

    return Promise.reject(error);
  }
);
