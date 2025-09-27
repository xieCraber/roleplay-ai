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
    
    // 处理特定错误
    if (error.response) {
      // 服务器响应但状态码不是2xx
      console.error('服务器错误:', error.response.status, error.response.data)
      
      // 如果是验证错误
      if (error.response.status === 400) {
        throw new Error('请求参数错误，请检查输入内容')
      }
      
      // 如果是服务不可用
      if (error.response.status === 503) {
        throw new Error('AI服务暂时不可用，请稍后重试')
      }
    } else if (error.request) {
      // 请求已发送但无响应
      console.error('无响应:', error.request)
      throw new Error('无法连接到服务器，请检查网络连接')
    } else {
      // 其他错误
      console.error('请求错误:', error.message)
      throw new Error('请求过程中发生错误')
    }
    
    throw error
  })
}

export const getChatHistory = (sessionId) => {
  return axios.get(`${API_BASE_URL}/history`, {
    params: { sessionId }
  }).then(response => response.data)
  .catch(error => {
    console.error('获取聊天历史失败:', error)
    
    // 处理特定错误
    if (error.response && error.response.status === 404) {
      return []; // 会话不存在，返回空数组
    }
    
    throw error
  })
}