import axios from 'axios';

// Create a custom axios instance without default headers for development mode
const apiClient = axios.create({
  timeout: 15000, // 15 second timeout for AI analysis
  headers: {}
});

// Remove any default headers that might be causing issues
delete apiClient.defaults.headers.common['Authorization'];

class AIAnalysisService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:6789/api';
  }

  async runAnalysis(initialData, validationData, modelType = 'ensemble') {
    try {
      const axiosConfig = {
        timeout: 30000, // Increased timeout for ensemble models
        headers: {}
      };

      const response = await apiClient.post(
        `${this.apiUrl}/ai/predict`,
        {
          initialData,
          validationData,
          modelType,
          systemConfig: {
            fishCount: 200,
            tankVolume: 1000,
            plantType: 'spearmint',
            growthSystem: 'raft'
          }
        },
        axiosConfig
      );

      return response.data;
    } catch (error) {
      console.error('Error running AI analysis:', error);
      throw new Error(error.response?.data?.message || 'Failed to run AI analysis');
    }
  }

  async getAnalysisHistory() {
    try {
      const axiosConfig = {
        timeout: 5000,
        headers: {}
      };

      const response = await apiClient.get(`${this.apiUrl}/ai/history`, axiosConfig);
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  async getAnalysisById(id) {
    try {
      const axiosConfig = {
        timeout: 5000,
        headers: {}
      };

      const response = await apiClient.get(
        `${this.apiUrl}/ai/${id}`,
        axiosConfig
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching analysis details:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch analysis details');
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();
