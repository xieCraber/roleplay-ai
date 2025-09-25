import axios from 'axios'

const API_BASE_URL = '/api/chat'

export const chat = (roleId, sessionId, message) => {
  return axios.post(API_BASE_URL, {
    roleId,
    sessionId,
    message
  }).then(response => response.data)
  .catch(error => {
    console.error('聊天请求失败:', error)
    throw error
  })
}

export const getChatHistory = (sessionId) => {
  return axios.get(`${API_BASE_URL}/history`, {
    params: { sessionId }
  }).then(response => response.data)
  .catch(error => {
    console.error('获取聊天历史失败:', error)
    throw error
  })
}