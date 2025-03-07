import apiClient from './apiClient';

class ChatbotService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:6789/api';
  }

  /**
   * Send a message to the chatbot
   * @param {string} message - User message
   * @param {string} sessionId - Chat session ID (optional)
   * @returns {Promise<Object>} - Response with message and session info
   */
  async sendMessage(message, sessionId = null) {
    try {
      const response = await apiClient.post(`${this.apiUrl}/chatbot/send`, {
        message,
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message to chatbot');
    }
  }

  /**
   * Get chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Object>} - Chat history
   */
  async getChatHistory(sessionId) {
    try {
      const response = await apiClient.get(`${this.apiUrl}/chatbot/history/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch chat history');
    }
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
