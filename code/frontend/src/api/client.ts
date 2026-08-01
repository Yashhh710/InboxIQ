import axios from 'axios'

export interface PredictMessagePayload {
  message_id: string
  message_text: string
  sender_user_id: string
  user_id: string
  group_id?: string | null
  business_id?: string | null
  conversation_type: string
  created_at: string
  forwarded_count?: number
  media_type?: string | null
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('No response received:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Health
  health: () => client.get('/health'),

  // Messages
  getMessages: (action?: string, messageType?: string, search?: string, skip = 0, limit = 50) =>
    client.get('/messages', {
      params: { action, message_type: messageType, search, skip, limit },
    }),
  getMessageDetail: (messageId: string) =>
    client.get(`/messages/${messageId}`),

  // Dashboard
  getDashboardStats: () => client.get('/dashboard'),
  getDashboardCharts: () => client.get('/dashboard/charts'),

  // Directory (group/business display names)
  getDirectory: () => client.get('/directory'),

  // Analytics
  getAnalytics: () => client.get('/analytics'),

  // Predictions
  predictMessage: (message: PredictMessagePayload) =>
    client.post('/predict', message),
  runFullModel: () =>
    client.post('/run-model'),

  // History
  getHistory: () => client.get('/history'),

  // Users
  getUsers: () => client.get('/users'),

  // Groups
  getGroups: () => client.get('/groups'),
}

export default client