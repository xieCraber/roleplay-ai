<template>
  <div class="chat-container">
    <!-- 会话历史侧边栏 -->
    <div class="sidebar">
      <SessionHistory @session-selected="loadSession" />
    </div>
    
    <!-- 聊天主区域 -->
    <div class="chat-main">
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
        
        <!-- 会话操作 -->
        <div class="header-actions">
          <el-dropdown @command="handleSessionAction">
            <el-button type="info" circle>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="new" icon="Plus">新建会话</el-dropdown-item>
                <el-dropdown-item command="export" icon="Download">导出会话</el-dropdown-item>
                <el-dropdown-item command="share" icon="Share">分享会话</el-dropdown-item>
                <el-dropdown-item command="clear" icon="Delete" divided>清除会话</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
        
        <!-- 会话分享弹窗 -->
        <el-dialog
          title="分享会话"
          v-model="showShareDialog"
          width="400px"
        >
          <div class="share-content">
            <p>选择分享方式：</p>
            <div class="share-options">
              <el-button type="primary" @click="copyShareLink">
                <el-icon><Link /></el-icon> 复制分享链接
              </el-button>
              <el-button type="success" @click="downloadSession">
                <el-icon><Download /></el-icon> 下载会话记录
              </el-button>
            </div>
            <div v-if="shareLink" class="share-link">
              <p>分享链接已生成：</p>
              <el-input 
                :model-value="shareLink" 
                readonly
                @focus="$event.target.select()"
              >
                <template #append>
                  <el-button @click="copyShareLink">复制</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-dialog>
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
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { useRoleStore } from '@/stores/roleStore'
import MessageBubble from '@/components/MessageBubble.vue'
import SessionHistory from '@/components/SessionHistory.vue'
import { stopAllSpeech } from '@/utils/speech'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Link, Download } from '@element-plus/icons-vue'

export default {
  name: 'ChatView',
  components: {
    MessageBubble,
    SessionHistory,
    MoreFilled,
    Link,
    Download
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
    const showShareDialog = ref(false)
    const shareLink = ref('')
    
    // 计算属性
    const currentRole = computed(() => roleStore.roles.find(r => r.id === roleId))
    const messages = computed(() => chatStore.messages)
    const isSending = computed(() => chatStore.isSending)
    const isStreaming = computed(() => chatStore.isStreaming)
    const isListening = computed(() => chatStore.isListening)
    
    // 方法
    const goBack = () => {
      // 退出前停止所有语音
      stopAllSpeech()
      chatStore.clearChat()
      router.push('/')
    }
    
    const getAvatarUrl = computed(() => {
      if (!currentRole.value) return 'https://api.dicebear.com/7.x/initials/svg?seed=default&backgroundColor=007acc,9ec1cf,e9f5f5&radius=20&fontColor=ffffff&baseColor=000000&accentColor=ffd700'
      
      if (currentRole.value.avatarUrl) {
        return currentRole.value.avatarUrl;
      }
      
      const seed = encodeURIComponent(currentRole.value.name);
      return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=007acc,9ec1cf,e9f5f5&radius=20&fontColor=ffffff&baseColor=000000&accentColor=ffd700`
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
    
    // 会话操作
    const handleSessionAction = (command) => {
      switch (command) {
        case 'new':
          newSession();
          break;
        case 'export':
          downloadSession();
          break;
        case 'share':
          showShareDialog.value = true;
          generateShareLink();
          break;
        case 'clear':
          clearSession();
          break;
      }
    }
    
    const newSession = () => {
      ElMessageBox.confirm('确定要开始新会话吗？当前会话将被保存', '新会话', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        chatStore.clearChat();
        chatStore.initChat(roleId);
      }).catch(() => {})
    }
    
    const clearSession = () => {
      ElMessageBox.confirm('确定要清除当前会话吗？此操作不可恢复', '清除会话', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        chatStore.clearChat();
        chatStore.initChat(roleId);
      }).catch(() => {})
    }
    
    const downloadSession = () => {
      const sessionData = {
        role: currentRole.value,
        messages: messages.value,
        timestamp: new Date().toISOString()
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `session-${currentRole.value.name}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      ElMessage.success('会话已下载');
    }
    
    const generateShareLink = () => {
      // 生成唯一分享ID
      const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // 保存会话数据到localStorage
      const sessionData = {
        role: currentRole.value,
        messages: messages.value,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`session-share-${shareId}`, JSON.stringify(sessionData));
      
      // 生成分享链接
      const baseUrl = window.location.origin;
      shareLink.value = `${baseUrl}/share/${shareId}`;
    }
    
    const copyShareLink = () => {
      navigator.clipboard.writeText(shareLink.value)
        .then(() => {
          ElMessage.success('分享链接已复制');
        })
        .catch(err => {
          console.error('复制失败:', err);
          ElMessage.error('复制失败，请手动复制');
        });
    }
    
    const loadSession = (session) => {
      // 切换到指定会话
      chatStore.sessionId = session.id;
      chatStore.messages = [];
      
      // 加载会话历史
      chatStore.loadHistory();
    }
    
    // 监听消息变化
    watch(messages, () => {
      scrollToBottom();
    })
    
    // 生命周期钩子
    onMounted(async () => {
      try {
        // 确保角色已加载
        if (roleStore.roles.length === 0) {
          await roleStore.loadRoles();
        }
        
        // 初始化聊天
        await chatStore.initChat(roleId);
      } catch (err) {
        console.error('初始化聊天失败:', err);
        error.value = '加载聊天失败，请检查网络连接';
      } finally {
        loading.value = false;
      }
      
      // 自动聚焦输入框
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    });
    
    // 组件卸载时停止所有语音
    onUnmounted(() => {
      stopAllSpeech();
      chatStore.clearChat();
    });
    
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
      isListening,
      showShareDialog,
      shareLink,
      handleSessionAction,
      loadSession,
      copyShareLink
    };
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f5f7fa;
}

.sidebar {
  width: 280px;
  border-right: 1px solid #ebeef5;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  flex: 1;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
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
  font-size: 0.8rem;
  color: #409eff;
  margin-top: 2px;
}

.header-actions {
  margin-left: auto;
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

/* 分享对话框样式 */
.share-content {
  padding: 10px 0;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.share-link {
  margin-top: 15px;
}
</style>