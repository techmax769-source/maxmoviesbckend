const axios = require('axios');

class MovieAPIClient {
  constructor() {
    this.baseURL = process.env.MOVIE_API_BASE_URL;
    this.apiKey = process.env.MOVIE_API_KEY;
    
    if (!this.baseURL || !this.apiKey) {
      throw new Error('MOVIE_API_BASE_URL and MOVIE_API_KEY must be set in environment variables');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MaxMovies-Backend/1.0'
      }
    });
    
    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Client Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(this.handleError(error));
      }
    );
  }

  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  handleError(error) {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || 'API request failed',
        data: error.response.data,
        originalError: error.message
      };
    } else if (error.request) {
      return {
        status: 503,
        message: 'No response from movie API - Service Unavailable',
        originalError: error.message
      };
    } else {
      return {
        status: 500,
        message: 'Error setting up request to movie API',
        originalError: error.message
      };
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await this.client.get('/homepage', { timeout: 5000 });
      return {
        status: 'healthy',
        apiStatus: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new MovieAPIClient();
