import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "https://chat-app-desktop-backend.vercel.app/api",
  withCredentials: false, // Disable credentials for Vercel compatibility
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Reduce timeout for faster failures
  maxRedirects: 3, // Limit redirects
  decompress: true, // Enable compression
});

// Add request interceptor to include token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request to:', config.baseURL + config.url);
    console.log('Request config:', config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  async (error) => {
    console.error('Response error:', error.response?.status, error.response?.data, error.message);
    
    const originalRequest = error.config;
    
    // Retry logic for timeout and 5xx errors
    if (
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || 
       error.response?.status >= 500 ||
       error.response?.status === 503)
    ) {
      originalRequest._retry = true;
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Retrying request...');
      return axiosInstance(originalRequest);
    }
    
    return Promise.reject(error);
  }
);