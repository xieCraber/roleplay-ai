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
    streamingMessageId: null,
    currentRoleId: null
  }),
  
  getters: {
    getCurrentRoleId() {
      return this.currentRoleId;
    }
  },
  
  actions: {
    async initChat(roleId) {
      this.messages = []
      this.isSending = false
      this.currentRoleId = roleId
      
      try {
        // 立即创建会话（后端会返回sessionId）
        const response = await chat(roleId, null, "你好")
        this.sessionId = response.sessionId
        
        // 加载角色信息
        const roleStore = useRoleStore()
        if (roleStore.roles.length === 0) {
          await roleStore.loadRoles()
        }
        
        // 加载聊天历史
        await this.loadHistory()
        
        // 如果是新会话，发送欢迎消息
        if (this.messages.length === 0) {
          const roleStore = useRoleStore()
          const role = roleStore.roles.find(r => r.id === roleId)
          
          if (role) {
            const welcomeMessage = `你好！我是${role.name}，${role.description}。有什么我可以帮助你的吗？`
            this.messages.push({
              sender: 'ai',
              content: welcomeMessage,
              isWelcome: true
            })
          }
        }
      } catch (error) {
        console.error('初始化聊天失败:', error)
        this.isSending = false
        
        // 添加友好提示
        this.messages.push({
          sender: 'ai',
          content: '无法连接AI服务，请检查网络或稍后重试',
          isError: true
        })
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
        
        // 添加友好提示
        this.messages.push({
          sender: 'ai',
          content: '加载历史消息失败，但可以继续新对话',
          isError: true
        })
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
        
        // 处理流式响应
        this.processStreamingResponse(response.reply)
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
    
    // 处理流式响应
    processStreamingResponse(fullResponse) {
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
          if (this.streamingContent && !this.isMuted) {
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
      }, (error) => {
        this.isListening = false
        console.error('语音识别错误:', error)
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