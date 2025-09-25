<template>
  <div class="role-card" @click="onClick">
    <div class="avatar">
      <img :src="getAvatarUrl" :alt="role.name">
    </div>
    <h3 class="role-name">{{ role.name }}</h3>
    <p class="role-archetype">{{ role.archetype }}</p>
    <p class="role-description">{{ role.description }}</p>
    <el-button type="primary" class="chat-btn">
      进入聊天
    </el-button>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    role: {
      type: Object,
      required: true
    }
  },
  emits: ['select'],
  setup(props, { emit }) {  // 修复：添加 { emit } 到 setup 参数
    const getAvatarUrl = computed(() => {
      // 使用DiceBear Initials风格生成专属头像
      const seed = encodeURIComponent(props.role.name);
      return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=007acc,9ec1cf,e9f5f5&radius=20&fontColor=ffffff&baseColor=000000&accentColor=ffd700`
    })
    
    const onClick = () => {
      emit('select', props.role) 
    }
    
    return {
      getAvatarUrl,
      onClick
    }
  }
}
</script>

<style scoped>
.role-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  padding: 20px;
}

.role-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.avatar {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff, #67c23a);
  margin-bottom: 15px;
}

.avatar img {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
}

.role-name {
  font-size: 1.4rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.role-archetype {
  font-size: 1.1rem;
  color: #409eff;
  font-weight: 500;
  margin-bottom: 10px;
}

.role-description {
  font-size: 0.95rem;
  color: #606266;
  line-height: 1.5;
  min-height: 60px;
}

.chat-btn {
  width: 100%;
  margin-top: 15px;
}
</style>