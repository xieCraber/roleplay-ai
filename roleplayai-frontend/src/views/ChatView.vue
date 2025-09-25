<template>
  <div class="chat-container">
    <header class="chat-header">
      <el-button type="info" icon="Back" @click="goBack" circle />
      <div class="role-info">
        <div class="avatar">
          <img :src="getAvatarUrl" alt="avatar" />
        </div>
        <div class="role-details">
          <h2>{{ currentRole?.name }}</h2>
          <p class="role-archetype">{{ currentRole?.archetype }}</p>
        </div>
      </div>
    </header>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="loading" class="loading-state">
        <el-spin />
        <p>正在加载聊天记录...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <el-alert type="error" :title="error" show-icon closable @close="clearError" />
      </div>
      
      <div v-else-if="messages.length === 0 && !isSending" class="empty-state">
        <el-empty description="开始与角色对话吧！">
          <el-button type="primary" @click="startVoiceInput">点击开始语音对话</el-button>
        </el-empty>
      </div>
      
      <MessageBubble 
        v-for="(message, index) in messages" 
        :key="index" 
        :message="message" 
      />
      
      <div v-if="isSending" class="message ai">
        <div class="message-content">
          <el-icon><Loading /></el-icon> AI思考中...
        </div>
      </div>
    </div>

    <footer class="chat-input">
      <div class="input-area">
        <div class="voice-btn" @click="startVoiceInput" :class="{ active: isListening }">
          <el-icon><Microphone /></el-icon>
        </div>
        
        <div class="input-box">
          <el-input 
            ref="inputRef"
            v-model="inputText" 
            placeholder="输入你想说的话..." 
            @keyup.enter="sendMessage"
          />
        </div>
        
        <el-button 
          type="success" 
          class="send-btn" 
          @click="sendMessage" 
          :disabled="isSending || !inputText.trim()"
        >
          <el-icon><Promotion /></el-icon>
        </el-button>
      </div>
      
      <div v-if="isListening" class="status-indicator">
        <el-icon><Microphone /></el-icon> 正在听...
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { useRoleStore } from '@/stores/roleStore'
import MessageBubble from '@/components/MessageBubble.vue'

export default {
  name: 'ChatView',
  components: {
    MessageBubble
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const chatStore = useChatStore()
    const roleStore = useRoleStore()
    
    const roleId = parseInt(route.params.id)
    const inputText = ref('')
    const messagesContainer = ref(null)
    const inputRef = ref(null)
    const loading = ref(true)
    const error = ref(null)
    
    // 计算属性
    const currentRole = computed(() => roleStore.roles.find(r => r.id === roleId))
    const messages = computed(() => chatStore.messages)
    const isSending = computed(() => chatStore.isSending)
    const isStreaming = computed(() => chatStore.isStreaming)
    const isListening = computed(() => chatStore.isListening)
    
    // 方法
    const goBack = () => {
      chatStore.clearChat()
      router.push('/')
    }
    
    const getAvatarUrl = computed(() => {
      if (!currentRole.value) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&radius=20&backgroundColor=b6e3f4'
      
      const seed = encodeURIComponent(currentRole.value.name);
      return `https://api.dicebear.com/7/x/avataaars/svg?seed=${seed}&radius=20&backgroundColor=b6e3f4,c0aede,d1d4f9`
    })
    
    const sendMessage = () => {
      if (!inputText.value.trim() || isSending.value) return
      
      // 使用store的sendMessage方法
      chatStore.sendMessage(inputText.value)
      
      // 清空输入框并聚焦
      inputText.value = ''
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
        }
      })
    }
    
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }
    
    const startVoiceInput = () => {
      if (!inputText.value) {
        chatStore.startVoiceInput()
      }
    }
    
    const clearError = () => {
      error.value = null
    }
    
    // 监听消息变化
    watch(messages, () => {
      scrollToBottom()
    })
    
    // 生命周期钩子
    onMounted(async () => {
      try {
        // 确保角色已加载
        if (roleStore.roles.length === 0) {
          await roleStore.loadRoles()
        }
        
        // 初始化聊天
        await chatStore.initChat(roleId)
      } catch (err) {
        console.error('初始化聊天失败:', err)
        error.value = '加载聊天失败，请检查网络连接'
      } finally {
        loading.value = false
      }
      
      // 自动聚焦输入框
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
        }
      })
    })
    
    onUnmounted(() => {
      chatStore.clearChat()
    })
    
    return {
      currentRole,
      messages,
      inputText,
      messagesContainer,
      inputRef,
      isSending,
      isStreaming,
      loading,
      error,
      goBack,
      getAvatarUrl,
      sendMessage,
      startVoiceInput,
      clearError,
      isListening
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f5f7fa;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.role-info {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  border: 2px solid #409eff;
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
  font-size: 0.8rem;
  color: #409eff;
  margin-top: 2px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chat-input {
  padding: 15px 20px;
  background-color: white;
  border-top: 1px solid #ebeef5;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f2f5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.voice-btn.active {
  background-color: #409eff;
  color: white;
}

.input-box {
  flex: 1;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  color: #409eff;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
}

.loading-state, .error-state {
  text-align: center;
  padding: 20px;
  color: #606266;
}
</style>