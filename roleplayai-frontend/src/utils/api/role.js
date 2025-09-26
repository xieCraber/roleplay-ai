import axios from 'axios'

const API_BASE_URL = '/api/roles'

export const fetchRoles = () => {
  return axios.get(API_BASE_URL)
    .then(response => response.data)
    .catch(error => {
      console.error('获取角色列表失败:', error)
      throw error
    })
}

export const fetchRoleById = (id) => {
  return axios.get(`${API_BASE_URL}/${id}`)
    .then(response => response.data)
    .catch(error => {
      console.error(`获取角色 ${id} 失败:`, error)
      throw error
    })
}

export const createRole = (roleData) => {
  return axios.post(`${API_BASE_URL}/addrole`, roleData)
    .then(response => response.data)
    .catch(error => {
      console.error('创建角色失败:', error)
      throw error
    })
}