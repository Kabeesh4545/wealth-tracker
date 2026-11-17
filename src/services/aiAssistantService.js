import api from './api';

/**
 * Sends a message to the AI Financial Assistant backend.
 * @param {string} message - User query message
 * @returns {Promise<object>} ChatResponse JSON schema object
 */
export const sendAssistantMessage = async (message) => {
  const response = await api.post('/api/assistant/chat', { message });
  return response.data;
};
