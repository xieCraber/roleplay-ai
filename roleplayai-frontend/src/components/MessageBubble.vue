<template>
  <div :class="['message-bubble', message.sender]">
    <div v-if="message.sender === 'ai'" class="voice-controls">
      <el-button 
        circle 
        size="small"
        class="voice-btn"
        @click="toggleAudio"
        :icon="isPlaying ? VideoPause : isPaused ? CaretRight : VideoPlay"
      />
      <!-- 临时移除静音按钮 -->
      <!-- 
      <el-button 
        v-if="isPlaying || isPaused"
        circle 
        size="small"
        class="mute-btn"
        @click="toggleMute"
        :icon="isMuted ? VolumeMute : VolumeUp"
      />
      -->
    </div>
    
    <!-- 技能触发效果 -->
    <div v-if="isSpellSkill" class="spell-effect">✨ 魔法特效</div>
    <div v-if="isSocraticSkill" class="socratic-effect">🤔 深度思考</div>
    <div v-if="isLiterarySkill" class="literary-effect">📜 文学魅力</div>
    
    <div class="content">
      {{ message.content }}
      <span v-if="isStreaming" class="cursor">▍</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
// 修正：只导入存在的图标
import { 
  VideoPlay, 
  VideoPause, 
  CaretRight, 
//   VolumeUp
  // 移除 VolumeMute 导入
} from '@element-plus/icons-vue'
import { 
  speakText, 
  isSpeechMuted,
  muteSpeech,
  unmuteSpeech
} from '@/utils/speech'

export default {
  components: {
    VideoPlay,
    VideoPause,
    CaretRight,
    // VolumeUp
    // 移除 VolumeMute 组件注册
  },
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isPlaying = ref(false)
    const isPaused = ref(false)
    const isMuted = ref(false)
    
    // 检查是否为流式消息
    const isStreaming = props.message.id && props.message.sender === 'ai'
    
    // 检测技能触发
    const isSpellSkill = props.message.content && (
      props.message.content.includes('魔杖') || 
      props.message.content.includes('咒语') ||
      props.message.content.includes('魔法') ||
      props.message.content.includes('霍格沃茨')
    )
    
    const isSocraticSkill = props.message.content && (
      props.message.content.includes('那么') || 
      props.message.content.includes('是否意味着') ||
      props.message.content.includes('你认为') ||
      props.message.content.includes('思考')
    )
    
    const isLiterarySkill = props.message.content && (
      props.message.content.includes('诗') || 
      props.message.content.includes('戏剧') ||
      props.message.content.includes('十四行诗') ||
      props.message.content.includes('文学')
    )
    
    const playAudio = () => {
      if (isPlaying.value || isPaused.value) return
      
      isPlaying.value = true
      isPaused.value = false
      isMuted.value = false
      
      speakText(
        props.message.content,
        () => {
          isPlaying.value = false
          isPaused.value = false
        },
        (error) => {
          console.error('播放语音失败:', error)
          isPlaying.value = false
          isPaused.value = false
        }
      )
    }
    
    const pauseAudio = () => {
      if (isPaused.value) {
        window.speechSynthesis.resume()
        isPaused.value = false
      } else if (isPlaying.value) {
        window.speechSynthesis.pause()
        isPaused.value = true
      }
    }
    
    const toggleAudio = () => {
      if (isPaused.value || isPlaying.value) {
        pauseAudio()
      } else {
        playAudio()
      }
    }
    
    // 临时移除静音功能
    /*
    const toggleMute = () => {
      if (isMuted.value) {
        unmuteSpeech()
        isMuted.value = false
      } else {
        muteSpeech()
        isMuted.value = true
      }
    }
    */
    
    // 监听语音状态变化
    const speechStatusCheck = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        isPlaying.value = true
        isPaused.value = window.speechSynthesis.paused
      } else {
        isPlaying.value = false
        isPaused.value = false
      }
      
      isMuted.value = isSpeechMuted()
    }, 100)
    
    // 组件卸载时清理
    onUnmounted(() => {
      clearInterval(speechStatusCheck)
    })
    
    return {
      isPlaying,
      isPaused,
      isStreaming,
      isSpellSkill,
      isSocraticSkill,
      isLiterarySkill,
      toggleAudio,
      // 移除 toggleMute,
      VideoPlay,
      VideoPause,
      CaretRight,
    //   VolumeUp
      // 移除 VolumeMute
    }
  }
}
</script>

<style scoped>
/* 样式部分保持不变 */
.message-bubble {
  max-width: 80%;
  padding: 12px 15px;
  border-radius: 18px;
  margin: 8px 0;
  position: relative;
  transition: all 0.3s ease;
  word-break: break-word;
}

.message-bubble.user {
  align-self: flex-end;
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 5px;
}

.message-bubble.ai {
  align-self: flex-start;
  background-color: #f0f2f5;
  color: #303133;
  border-bottom-left-radius: 5px;
}

.voice-controls {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
}

.voice-btn, .mute-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 12px;
}

.content {
  display: inline-block;
  min-height: 1.5em;
  padding-right: 40px; /* 为控制按钮留出空间 */
}

.cursor {
  animation: blink 1s infinite;
}

/* 技能特效样式 */
.spell-effect {
  position: absolute;
  top: -20px;
  right: 10px;
  background: linear-gradient(45deg, #ff00ff, #00ffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  animation: sparkle 1s infinite;
}

.socratic-effect {
  position: absolute;
  top: -20px;
  right: 10px;
  color: #909399;
  font-weight: bold;
}

.literary-effect {
  position: absolute;
  top: -20px;
  right: 10px;
  color: #e6a23c;
  font-style: italic;
}

@keyframes sparkle {
  0% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #e600e6, 0 0 20px #e600e6; }
  50% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #00ffff, 0 0 20px #00ffff; }
  100% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #e600e6, 0 0 20px #e600e6; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>