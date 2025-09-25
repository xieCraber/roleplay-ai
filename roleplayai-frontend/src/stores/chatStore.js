import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chat, getChatHistory } from '@/utils/api/chat'
import { useRoleStore } from '@/stores/roleStore'
import { startSpeechRecognition, speakText } from '@/utils/speech'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessionId: null,
    messages: [],
    isSending: false,
    isStreaming: false,
    isListening: false,
    streamingContent: '',
    streamingMessageId: null
  }),
  
  getters: {
    currentRoleId() {
      const path = window.location.pathname
      const match = path.match(/\/chat\/(\d+)/)
      return match ? parseInt(match[1]) : null
    }
  },
  
  actions: {
    async initChat(roleId) {
      this.messages = []
      this.sessionId = null
      this.isSending = false
      
      try {
        // 创建新会话
        this.sessionId = null
        
        // 加载角色信息
        const roleStore = useRoleStore()
        if (roleStore.roles.length === 0) {
          await roleStore.loadRoles()
        }
        
        // 加载聊天历史（如果存在）
        if (this.sessionId) {
          await this.loadHistory()
        }
      } catch (error) {
        console.error('初始化聊天失败:', error)
        this.isSending = false
        throw error
      }
    },
    
    async loadHistory() {
      if (!this.sessionId) return
      
      try {
        const history = await getChatHistory(this.sessionId)
        this.messages = history.map(item => [
          { sender: 'user', content: item.userMessage, id: item.id },
          { sender: 'ai', content: item.assistantReply, id: item.id }
        ]).flat()
      } catch (error) {
        console.error('加载聊天历史失败:', error)
      }
    },
    
    async sendMessage(content) {
      if (!content || !content.trim()) {
        console.warn('消息内容为空，不发送')
        return
      }
      
      if (this.isSending) {
        console.warn('AI正在思考中，请稍后再试')
        return
      }
      
      try {
        // 添加用户消息到界面
        this.messages.push({
          sender: 'user',
          content: content
        })
        
        // 重置会话ID（如果是第一次发送）
        if (!this.sessionId) {
          this.sessionId = null
        }
        
        // 设置发送状态
        this.isSending = true
        this.isStreaming = true
        this.streamingContent = ''
        this.streamingMessageId = Date.now()
        
        // 添加AI消息占位符
        this.messages.push({
          sender: 'ai',
          content: '',
          id: this.streamingMessageId
        })
        
        // 通过API发送消息
        const response = await chat(
          this.currentRoleId,
          this.sessionId,
          content
        )
        
        // 更新会话ID
        this.sessionId = response.sessionId
        
        // 模拟流式效果
        this.simulateStreaming(response.reply)
      } catch (error) {
        console.error('发送消息失败:', error)
        this.isSending = false
        this.isStreaming = false
        
        // 添加错误消息
        this.messages.push({
          sender: 'ai',
          content: '抱歉，AI服务调用失败，请稍后重试',
          isError: true
        })
      }
    },
    
    // 模拟流式效果
    simulateStreaming(fullResponse) {
      const chunkSize = 15 // 每次显示的字符数
      const delay = 30 // 毫秒
      
      let index = 0
      const interval = setInterval(() => {
        if (index < fullResponse.length) {
          const chunk = fullResponse.substring(index, index + chunkSize)
          index += chunkSize
          
          // 更新流式内容
          this.streamingContent += chunk
          
          // 更新AI消息内容
          const aiMessageIndex = this.messages.findIndex(m => 
            m.id === this.streamingMessageId
          )
          
          if (aiMessageIndex !== -1) {
            this.messages[aiMessageIndex].content = this.streamingContent
          }
        } else {
          clearInterval(interval)
          this.isSending = false
          this.isStreaming = false
          
          // 播放AI回复
          if (this.streamingContent) {
            speakText(this.streamingContent)
          }
        }
      }, delay)
    },
    
    startVoiceInput() {
      if (this.isListening) return
      
      this.isListening = true
      startSpeechRecognition((transcript) => {
        this.isListening = false
        if (transcript.trim()) {
          this.sendMessage(transcript)
        }
      }, () => {
        this.isListening = false
      })
    },
    
    clearChat() {
      this.sessionId = null
      this.messages = []
      this.isSending = false
      this.isStreaming = false
    }
  }
})