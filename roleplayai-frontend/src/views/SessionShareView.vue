<template>
  <div class="session-share-container">
    <header class="header">
      <el-button type="info" icon="Back" @click="goBack" circle />
      <h1 class="title">会话分享</h1>
    </header>
    
    <div class="content">
      <div v-if="loading" class="loading-state">
        <el-spin />
        <p>加载分享内容...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <el-alert type="error" :title="error" show-icon closable @close="clearError" />
      </div>
      
      <div v-else-if="sessionData" class="session-content">
        <div class="role-info">
          <div class="avatar">
            <img :src="getAvatarUrl" alt="avatar" />
          </div>
          <div class="role-details">
            <h2>{{ sessionData.role.name }}</h2>
            <p class="role-archetype">{{ sessionData.role.archetype }}</p>
          </div>
        </div>
        
        <div class="messages">
          <div 
            v-for="(message, index) in sessionData.messages" 
            :key="index" 
            :class="['message', message.sender]"
          >
            <div class="content">{{ message.content }}</div>
          </div>
        </div>
        
        <div class="share-actions">
          <el-button type="primary" @click="addToMyRoles">
            <el-icon><Plus /></el-icon> 添加到我的角色
          </el-button>
          <el-button @click="downloadSession">
            <el-icon><Download /></el-icon> 下载会话
          </el-button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="分享内容不存在或已过期" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoleStore } from '@/stores/roleStore'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roleStore = useRoleStore()
    
    const loading = ref(true)
    const error = ref(null)
    const sessionData = ref(null)
    const shareId = ref(route.params.id)
    
    // 计算属性
    const getAvatarUrl = computed(() => {
      if (!sessionData.value || !sessionData.value.role) return ''
      
      if (sessionData.value.role.avatarUrl) {
        return sessionData.value.role.avatarUrl;
      }
      
      const seed = encodeURIComponent(sessionData.value.role.name);
      return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=007acc,9ec1cf,e9f5f5&radius=20&fontColor=ffffff&baseColor=000000&accentColor=ffd700`
    })
    
    // 方法
    const loadSession = () => {
      try {
        const sessionKey = `session-share-${shareId.value}`
        const storedData = localStorage.getItem(sessionKey)
        
        if (storedData) {
          sessionData.value = JSON.parse(storedData)
          
          // 检查会话是否过期（24小时）
          const now = new Date()
          const sessionTime = new Date(sessionData.value.timestamp)
          const diffHours = (now - sessionTime) / (1000 * 60 * 60)
          
          if (diffHours > 24) {
            error.value = '分享链接已过期'
            sessionData.value = null
          }
        } else {
          error.value = '分享内容不存在或已过期'
        }
      } catch (e) {
        error.value = '无法解析分享内容'
        console.error('解析分享内容失败:', e)
      } finally {
        loading.value = false
      }
    }
    
    const clearError = () => {
      error.value = null
    }
    
    const goBack = () => {
      router.back()
    }
    
    const addToMyRoles = () => {
      // 这里可以实现从分享会话创建新角色的功能
      ElMessage.success('已添加到我的角色列表')
      router.push('/')
    }
    
    const downloadSession = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionData.value, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `shared-session-${sessionData.value.role.name}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      ElMessage.success('会话已下载');
    }
    
    onMounted(() => {
      loadSession()
    })
    
    return {
      loading,
      error,
      sessionData,
      getAvatarUrl,
      clearError,
      goBack,
      addToMyRoles,
      downloadSession
    }
  }
}
</script>

<style scoped>
.session-share-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.title {
  margin-left: 15px;
  font-size: 1.5rem;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px 0;
  color: #606266;
}

.role-info {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  border: 2px solid #409eff;
  background: linear-gradient(135deg, #409eff, #67c23a);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.role-details {
  display: flex;
  flex-direction: column;
}

.role-archetype {
  font-size: 0.9rem;
  color: #409eff;
  margin-top: 2px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.message {
  max-width: 80%;
  padding: 12px 15px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
}

.message.user {
  align-self: flex-end;
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 5px;
}

.message.ai {
  align-self: flex-start;
  background-color: #f0f2f5;
  color: #303133;
  border-bottom-left-radius: 5px;
}

.share-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 15px 0;
}
</style>