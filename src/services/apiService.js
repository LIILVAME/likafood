import axios from 'axios';
import { mockDataService } from './mockDataService';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001/api';
    this.useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true' || false;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const user = this.getCurrentUser();
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('likafood_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem('likafood_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async request(method, url, data = null, config = {}) {
    try {
      // Use mock data if enabled or if API is unreachable
      if (this.useMockData) {
        return await mockDataService.handleRequest(method, url, data);
      }

      const response = await this.client.request({
        method,
        url,
        data,
        ...config,
      });

      return response;
    } catch (error) {
      // Fallback to mock data if API is unreachable
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        console.warn('API unreachable, falling back to mock data');
        return await mockDataService.handleRequest(method, url, data);
      }
      throw error;
    }
  }

  async get(url, config = {}) {
    return this.request('GET', url, null, config);
  }

  async post(url, data, config = {}) {
    return this.request('POST', url, data, config);
  }

  async put(url, data, config = {}) {
    return this.request('PUT', url, data, config);
  }

  async patch(url, data, config = {}) {
    return this.request('PATCH', url, data, config);
  }

  async delete(url, config = {}) {
    return this.request('DELETE', url, null, config);
  }
}

export const apiService = new ApiService();