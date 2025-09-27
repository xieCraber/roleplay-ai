<template>
  <div class="session-history">
    <div class="history-header">
      <h3>会话历史</h3>
      <el-button 
        type="info" 
        size="small" 
        icon="Refresh" 
        @click="loadSessions"
        :loading="loading"
      >
        刷新
      </el-button>
    </div>
    
    <div v-if="loading" class="loading">
      <el-spin />
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <el-alert type="error" :title="error" show-icon closable @close="error = null" />
    </div>
    
    <div v-else-if="sessions.length === 0" class="empty">
      <el-empty description="暂无会话记录" />
    </div>
    
    <div v-else class="sessions-list">
      <div 
        v-for="session in sessions" 
        :key="session.id" 
        class="session-item"
        :class="{ active: currentSessionId === session.id }"
        @click="selectSession(session)"
      >
        <div class="session-avatar">
          <img :src="getRoleAvatar(session)" alt="角色头像" />
        </div>
        <div class="session-info">
          <h4>{{ session.roleName }}</h4>
          <p class="preview">{{ getPreviewText(session) }}</p>
          <p class="time">{{ formatTime(session.lastMessageTime) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoleStore } from '@/stores/roleStore'
import { getChatHistory } from '@/utils/api/chat'

export default {
  emits: ['session-selected'],
  setup(props, { emit }) {
    const loading = ref(true)
    const error = ref(null)
    const sessions = ref([])
    const roleStore = useRoleStore()
    
    // 从localStorage获取当前会话ID
    const currentSessionId = ref(localStorage.getItem('currentSessionId') || null)
    
    const loadSessions = async () => {
      loading.value = true
      error.value = null
      
      try {
        // 确保角色已加载
        if (roleStore.roles.length === 0) {
          await roleStore.loadRoles()
        }
        
        // 获取所有角色的会话
        const allSessions = []
        
        for (const role of roleStore.roles) {
          try {
            // 获取该角色的最近50条会话记录
            const history = await getChatHistory(`session-${role.id}-latest`)
            
            if (history && history.length > 0) {
              const lastMessage = history[history.length - 1]
              allSessions.push({
                id: `session-${role.id}-${lastMessage.id}`,
                roleId: role.id,
                roleName: role.name,
                lastMessageTime: new Date(lastMessage.createdAt),
                preview: lastMessage.assistantReply.substring(0, 50) + (lastMessage.assistantReply.length > 50 ? '...' : '')
              })
            }
          } catch (e) {
            console.error(`获取角色 ${role.id} 的会话失败:`, e)
          }
        }
        
        // 按时间排序
        sessions.value = allSessions.sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        )
      } catch (err) {
        error.value = '加载会话历史失败，请检查网络连接'
        console.error('加载会话历史失败:', err)
      } finally {
        loading.value = false
      }
    }
    
    const getRoleAvatar = (session) => {
      const role = roleStore.roles.find(r => r.id === session.roleId)
      return role?.avatarUrl || 
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(role?.name || 'default')}&backgroundColor=007acc,9ec1cf,e9f5f5&radius=20&fontColor=ffffff&baseColor=000000&accentColor=ffd700`
    }
    
    const getPreviewText = (session) => {
      if (session.preview) return session.preview
      return '与' + session.roleName + '的对话'
    }
    
    const formatTime = (date) => {
      if (!date) return ''
      
      const now = new Date()
      const target = new Date(date)
      
      // 同一天
      if (now.getDate() === target.getDate() && 
          now.getMonth() === target.getMonth() && 
          now.getFullYear() === target.getFullYear()) {
        return target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (yesterday.getDate() === target.getDate() && 
          yesterday.getMonth() === target.getMonth() && 
          yesterday.getFullYear() === target.getFullYear()) {
        return '昨天 ' + target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      // 更早
      return target.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
    
    const selectSession = (session) => {
      currentSessionId.value = session.id
      localStorage.setItem('currentSessionId', session.id)
      emit('session-selected', session)
    }
    
    onMounted(() => {
      loadSessions()
    })
    
    return {
      loading,
      error,
      sessions,
      currentSessionId,
      getRoleAvatar,
      getPreviewText,
      formatTime,
      loadSessions,
      selectSession
    }
  }
}
</script>

<style scoped>
.session-history {
  border-right: 1px solid #ebeef5;
  width: 280px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.history-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.session-item {
  padding: 12px 15px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.session-item:hover {
  background-color: #f5f7fa;
}

.session-item.active {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.session-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  flex-shrink: 0;
}

.session-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.session-info {
  flex: 1;
  overflow: hidden;
}

.session-info h4 {
  margin: 0 0 5px 0;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview {
  margin: 0;
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 18px;
}

.time {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #c0c4cc;
}
</style>