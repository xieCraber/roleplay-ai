<template>
  <div :class="['message-bubble', message.sender]">
    <div v-if="message.sender === 'ai'" class="voice-btn" @click="playAudio">
      <el-icon v-if="isPlaying"><Loading /></el-icon>
      <el-icon v-else><VideoPlay /></el-icon>
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
import { ref } from 'vue'
import { speakText } from '@/utils/speech'

export default {
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isPlaying = ref(false)
    
    const playAudio = () => {
      if (isPlaying.value) return
      
      isPlaying.value = true
      speakText(
        props.message.content,
        () => { isPlaying.value = false },
        (error) => {
          console.error('播放语音失败:', error)
          isPlaying.value = false
        }
      )
    }
    
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
    
    return {
      isPlaying,
      playAudio,
      isStreaming,
      isSpellSkill,
      isSocraticSkill,
      isLiterarySkill
    }
  }
}
</script>

<style scoped>
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

.voice-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #dcdfe6;
  margin-right: 8px;
  cursor: pointer;
  color: #409eff;
}

.content {
  display: inline-block;
  min-height: 1.5em;
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