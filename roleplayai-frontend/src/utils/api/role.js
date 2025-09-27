// src/utils/api/role.js
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

// 修正：正确处理 multipart/form-data
export const createRole = (name, description, avatarFile) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  
  // 只有在有文件时才添加
  if (avatarFile) {
    formData.append('avatar', avatarFile, avatarFile.name);
  }

  return axios.post(`${API_BASE_URL}/addrole`, formData, {
    // 关键：不要手动设置 Content-Type
    // 浏览器会自动设置正确的 Content-Type 和 boundary
  }).then(response => response.data)
  .catch(error => {
    console.error('创建角色失败:', error);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      let errorMessage = '创建角色失败';
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      throw new Error(errorMessage);
    }
    
    throw new Error('无法连接服务器，请检查网络');
  });
}