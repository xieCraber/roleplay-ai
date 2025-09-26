<template>
  <div class="role-list-container">
    <header class="header">
      <h1 class="title">🎭 RolePlay-AI</h1>
      <p class="subtitle">— 与你喜欢的角色语音对话 —</p>
    </header>

    <div class="search-box">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜索角色..." 
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div v-if="loading" class="loading-state">
      <el-spin />
      <p>正在加载角色列表...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <el-alert type="error" :title="error" show-icon closable @close="clearError" />
    </div>
    
    <div v-else-if="filteredRoles.length === 0" class="empty-state">
      <el-empty description="没有找到匹配的角色">
        <el-button type="primary" @click="searchQuery = ''">显示全部角色</el-button>
      </el-empty>
    </div>
    
    <div v-else class="roles-grid">
      <RoleCard 
        v-for="role in filteredRoles" 
        :key="role.id" 
        :role="role"
        @select="startChat"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoleStore } from '@/stores/roleStore'
import RoleCard from '@/components/RoleCard.vue'

export default {
  components: {
    RoleCard
  },
  setup() {
    const searchQuery = ref('')
    const roleStore = useRoleStore()
    const router = useRouter()
    
    const filteredRoles = computed(() => {
      if (!searchQuery.value) {
        return roleStore.roles
      }
      
      const query = searchQuery.value.toLowerCase()
      return roleStore.roles.filter(role => 
        role.name.toLowerCase().includes(query) || 
        role.description.toLowerCase().includes(query) ||
        role.archetype.toLowerCase().includes(query)
      )
    })
    
    const startChat = (role) => {
      router.push(`/chat/${role.id}`)
    }
    
    const clearError = () => {
      roleStore.error = null
    }
    
    onMounted(async () => {
      await roleStore.loadRoles()
    })
    
    return {
      searchQuery,
      filteredRoles,
      startChat,
      loading: computed(() => roleStore.loading),
      error: computed(() => roleStore.error),
      clearError
    }
  }
}
</script>

<style scoped>
.role-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 2.5rem;
  color: #409eff;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2rem;
  color: #606266;
}

.search-box {
  max-width: 600px;
  margin: 0 auto 30px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  /* 修复：确保网格正确显示 */
  width: 100%;
  padding: 0 10px;
}

/* 添加响应式调整 */
@media (max-width: 768px) {
  .roles-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .roles-grid {
    grid-template-columns: 1fr;
  }
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px 0;
  color: #606266;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
}
</style>