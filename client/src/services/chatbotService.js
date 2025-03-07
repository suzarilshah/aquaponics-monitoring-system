import apiClient from './apiClient';

class ChatbotService {
  /**
   * Send a message to the chatbot
   * @param {string} message - User message
   * @param {string} sessionId - Chat session ID (optional)
   * @returns {Promise<Object>} - Response with message and session info
   */
  async sendMessage(message, sessionId = null) {
    try {
      const response = await apiClient.post('/chatbot/send', {
        message,
        sessionId,
        telemetryData: await this.getLatestTelemetry() // Include latest telemetry for context
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
      }
      throw new Error(
        error.response?.data?.message || 
        'Unable to process your message. Please try again later.'
      );
    }
  }

  /**
   * Get chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Object>} - Chat history
   */
  async getChatHistory(sessionId) {
    try {
      const response = await apiClient.get(`/chatbot/history/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error(
        error.response?.data?.message || 
        'Unable to load chat history. Please refresh the page.'
      );
    }
  }

  /**
   * Get latest telemetry data for context
   * @returns {Promise<Object>} - Latest telemetry data
   */
  async getLatestTelemetry() {
    try {
      const response = await apiClient.get('/telemetry/latest');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch latest telemetry for context:', error);
      return null; // Continue without telemetry data
    }
  }

  /**
   * Clear chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<void>}
   */
  async clearHistory(sessionId) {
    try {
      await apiClient.delete(`/chatbot/history/${sessionId}`);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error(
        error.response?.data?.message || 
        'Unable to clear chat history. Please try again.'
      );
    }
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
