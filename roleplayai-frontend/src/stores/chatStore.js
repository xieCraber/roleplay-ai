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
    currentRoleId: null,
    // 新增：更精细的流式控制
    streamSpeed: 40, // 基础打字速度(ms/字符)
    minStreamSpeed: 20, // 最小速度
    maxStreamSpeed: 80, // 最大速度
    punctuationDelayMultiplier: 2.5, // 标点延迟倍数
    wordDelayMultiplier: 1.2, // 词语延迟倍数
    // 新增：AI思考状态
    aiThinking: false,
    aiThinkingTimer: null
  }),
  
  getters: {
    getCurrentRoleId() {
      return this.currentRoleId;
    }
  },
  
  actions: {
    async initChat(roleId, forceNewSession = false) {
      this.messages = []
      this.isSending = false
      this.currentRoleId = roleId
      
      // 检查是否有已保存的sessionId
      const savedSessionKey = `session_${roleId}`
      let existingSessionId = null
      
      if (!forceNewSession) {
        existingSessionId = localStorage.getItem(savedSessionKey)
      }
      
      try {
        // 加载角色信息
        const roleStore = useRoleStore()
        if (roleStore.roles.length === 0) {
          await roleStore.loadRoles()
        }
        
        // 如果有现有会话，先加载历史记录
        if (existingSessionId) {
          this.sessionId = existingSessionId
          await this.loadHistory()
          
          // 如果历史记录为空，说明会话可能已过期，创建新会话
          if (this.messages.length === 0) {
            existingSessionId = null
          }
        }
        
        // 如果没有现有会话或强制创建新会话，创建新会话
        if (!existingSessionId) {
          const response = await chat(roleId, null, "你好")
          this.sessionId = response.sessionId
          
          // 保存sessionId到localStorage
          localStorage.setItem(savedSessionKey, this.sessionId)
          
          // 加载新会话的历史记录
          await this.loadHistory()
          
          // 如果是新会话，发送欢迎消息
          if (this.messages.length === 0) {
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
        // 后端返回的是倒序，需要反转成正序（最早的在前面）
        const reversedHistory = history.reverse()
        this.messages = reversedHistory.map(item => [
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
        
        // 设置AI思考状态
        this.startAiThinking()
        
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
        
        // 更新会话ID并保存到localStorage
        this.sessionId = response.sessionId
        const savedSessionKey = `session_${this.currentRoleId}`
        localStorage.setItem(savedSessionKey, this.sessionId)
        
        // 停止AI思考状态
        this.stopAiThinking()
        
        // 使用更真实的流式效果
        this.realisticStreaming(response.reply)
      } catch (error) {
        console.error('发送消息失败:', error)
        this.isSending = false
        this.isStreaming = false
        this.stopAiThinking()
        
        // 添加错误消息
        this.messages.push({
          sender: 'ai',
          content: '抱歉，AI服务调用失败，请稍后重试',
          isError: true
        })
      }
    },
    
    // 新增：AI思考状态
    startAiThinking() {
      this.aiThinking = true
      
      // 清除可能存在的旧计时器
      if (this.aiThinkingTimer) {
        clearTimeout(this.aiThinkingTimer)
      }
      
      // 随机思考时间 (500-1500ms)
      const thinkingTime = 500 + Math.random() * 1000
      
      this.aiThinkingTimer = setTimeout(() => {
        // 仅当仍在发送状态时才继续
        if (this.isSending) {
          // 检查是否已有思考状态显示
          const hasThinkingMessage = this.messages.some(m => 
            m.sender === 'ai' && m.isThinking
          )
          
          if (!hasThinkingMessage) {
            this.messages.push({
              sender: 'ai',
              content: '思考中...',
              isThinking: true,
              id: 'thinking-' + Date.now()
            })
          }
        }
      }, thinkingTime)
    },
    
    stopAiThinking() {
      if (this.aiThinkingTimer) {
        clearTimeout(this.aiThinkingTimer)
        this.aiThinkingTimer = null
      }
      
      this.aiThinking = false
      
      // 移除思考中消息
      this.messages = this.messages.filter(m => !m.isThinking)
    },
    
    // 更真实的流式效果
    realisticStreaming(fullResponse) {
      // 移除思考中消息（如果有）
      this.messages = this.messages.filter(m => !m.isThinking)
      
      let index = 0
      const totalLength = fullResponse.length
      
      // 计算自适应速度（内容越长，打字越快）
      const adaptiveSpeed = Math.max(
        this.minStreamSpeed,
        Math.min(
          this.maxStreamSpeed,
          this.streamSpeed * (1 - Math.min(1, totalLength / 500))
        )
      )
      
      const typeNextCharacter = () => {
        if (index < fullResponse.length) {
          const char = fullResponse[index]
          this.streamingContent += char
          index++
          
          // 更新AI消息内容
          const aiMessageIndex = this.messages.findIndex(m => 
            m.id === this.streamingMessageId
          )
          
          if (aiMessageIndex !== -1) {
            this.messages[aiMessageIndex].content = this.streamingContent
          }
          
          // 计算下一个字符的延迟
          let nextDelay = adaptiveSpeed
          
          // 根据字符类型调整延迟
          if (['，', ',', '。', '.', '!', '？', '?', '；', ';', ':', '：', '、', ' '].includes(char)) {
            nextDelay *= this.punctuationDelayMultiplier
          } else if (['的', '了', '和', '是', '在', '有', '人', '这', '上', '中', '大', '国'].includes(char)) {
            // 常见汉字稍微慢一点
            nextDelay *= this.wordDelayMultiplier
          }
          
          // 随机波动 (±20%)
          nextDelay *= 0.8 + Math.random() * 0.4
          
          setTimeout(typeNextCharacter, nextDelay)
        } else {
          this.isSending = false
          this.isStreaming = false
          
          // 播放AI回复
          if (this.streamingContent && !this.isMuted) {
            speakText(this.streamingContent)
          }
        }
      }
      
      // 开始打字
      setTimeout(typeNextCharacter, adaptiveSpeed)
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
      this.stopAiThinking()
    },
    
    // 清除特定角色的会话
    clearRoleSession(roleId) {
      const savedSessionKey = `session_${roleId}`
      localStorage.removeItem(savedSessionKey)
      
      if (this.currentRoleId === roleId) {
        this.clearChat()
      }
    },
    
    // 获取角色的会话ID
    getRoleSessionId(roleId) {
      const savedSessionKey = `session_${roleId}`
      return localStorage.getItem(savedSessionKey)
    }
  }
})