import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchRoles } from '@/utils/api/role'

export const useRoleStore = defineStore('role', () => {
  const roles = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadRoles = async () => {
    loading.value = true
    error.value = null
    
    try {
      roles.value = await fetchRoles()
    } catch (err) {
      console.error('加载角色失败:', err)
      error.value = '加载角色失败，请检查网络连接'
    } finally {
      loading.value = false
    }
  }

  return {
    roles,
    loading,
    error,
    loadRoles
  }
})