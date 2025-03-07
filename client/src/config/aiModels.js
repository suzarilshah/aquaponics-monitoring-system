// Azure AI Foundry Models Configuration
export const AI_MODELS = {
  'o1-mini': {
    name: 'O1 Mini',
    provider: 'azure',
    model: 'azure/o1-mini',
    apiBase: 'https://suzarilshah.openai.azure.com/openai/deployments/o1-mini/chat/completions?api-version=2024-08-01-preview',
    apiKey: 'eedab6c2725a4edfa1cc50b8dfd82bb8',
    apiVersion: '2024-08-01-preview'
  },
  'deepseek-r1': {
    name: 'DeepSeek R1',
    provider: 'azure',
    model: 'azure/deepseek-r1',
    apiBase: 'https://suzarilshah.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview',
    apiKey: 'eedab6c2725a4edfa1cc50b8dfd82bb8',
    apiVersion: '2024-05-01-preview',
    modelName: 'DeepSeek' // Add model name for the API request
  },
  'ensemble': {
    name: 'Ensemble (Multiple Models)',
    description: 'Uses both models and combines their results for higher accuracy'
  }
};
