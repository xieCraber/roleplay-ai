<template>
  <div class="role-list-container">
    <header class="header">
      <h1 class="title">🎭 RolePlay-AI</h1>
      <p class="subtitle">— 与你喜欢的角色语音对话 —</p>
    </header>

    <div class="controls">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜索角色..." 
        clearable
        class="search-box"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button 
        type="primary" 
        class="add-role-btn"
        @click="showAddRoleDialog = true"
      >
        <el-icon><Plus /></el-icon> 添加角色
      </el-button>
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
    
    <!-- 添加角色对话框 -->
    <el-dialog
      title="添加新角色"
      v-model="showAddRoleDialog"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form 
        :model="newRoleForm" 
        :rules="rules" 
        ref="roleForm"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="newRoleForm.name" placeholder="例如：哈利·波特" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="newRoleForm.description" 
            type="textarea"
            :rows="4"
            placeholder="简要描述角色特点，例如：霍格沃茨四年级学生，勇敢正义" 
          />
        </el-form-item>
        
        <!-- 角色头像上传 -->
        <el-form-item label="角色头像">
          <el-upload
            v-if="!previewImage"
            class="avatar-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <el-button type="primary">选择头像</el-button>
            <div class="upload-hint">支持JPG/PNG/GIF/WebP格式，最大5MB</div>
          </el-upload>
          
          <div v-else class="avatar-preview">
            <img :src="previewImage" class="avatar" />
            <div class="avatar-actions">
              <el-button type="info" size="small" @click="removeAvatar">重新选择</el-button>
            </div>
          </div>
        </el-form-item>
        
        <!-- AI生成状态 -->
        <el-form-item label="AI生成中" v-if="isGenerating">
          <el-progress :percentage="progress" :indeterminate="true" :status="progressStatus" />
          <p class="generation-status">{{ generationStatus }}</p>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose" :disabled="isGenerating">取消</el-button>
          <el-button type="primary" @click="submitNewRole" :loading="isSubmitting" :disabled="isGenerating">
            确认添加
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoleStore } from '@/stores/roleStore'
import RoleCard from '@/components/RoleCard.vue'
import { createRole } from '@/utils/api/role'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  components: {
    RoleCard
  },
  setup() {
    const searchQuery = ref('')
    const roleStore = useRoleStore()
    const router = useRouter()
    
    // 新增角色相关
    const showAddRoleDialog = ref(false)
    const isSubmitting = ref(false)
    const isGenerating = ref(false)
    const progress = ref(0)
    const progressStatus = ref('warning')
    const generationStatus = ref('AI正在生成角色信息...')
    const roleForm = ref(null)
    const previewImage = ref(null)
    const selectedFile = ref(null)
    
    const newRoleForm = ref({
      name: '',
      description: ''
    })
    
    const rules = {
      name: [
        { required: true, message: '请输入角色名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入角色描述', trigger: 'blur' },
        { min: 10, max: 200, message: '长度在 10 到 200 个字符', trigger: 'blur' }
      ]
    }
    
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
    
    // 处理对话框关闭
    const handleDialogClose = (done) => {
      if (isGenerating.value) {
        ElMessage.warning('AI正在生成角色信息，请稍等...')
        return
      }
      
      if (!isSubmitting.value) {
        if (newRoleForm.value.name || newRoleForm.value.description) {
          ElMessageBox.confirm('表单内容未保存，确定要关闭吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            resetForm()
            showAddRoleDialog.value = false
            if (typeof done === 'function') done()
          }).catch(() => {})
        } else {
          resetForm()
          showAddRoleDialog.value = false
          if (typeof done === 'function') done()
        }
      }
    }
    
    // 重置表单
    const resetForm = () => {
      newRoleForm.value = {
        name: '',
        description: ''
      }
      previewImage.value = null
      selectedFile.value = null
      progress.value = 0
      progressStatus.value = 'warning'
      generationStatus.value = 'AI正在生成角色信息...'
      isGenerating.value = false
      
      if (roleForm.value) {
        roleForm.value.resetFields()
      }
    }
    
    // 处理头像选择
    const handleAvatarChange = (file) => {
      // 验证文件类型和大小
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.raw.type)
      const isValidSize = file.raw.size / 1024 / 1024 < 5
      
      if (!isValidType) {
        ElMessage.error('仅支持JPG/PNG/GIF/WebP格式的图片')
        return false
      }
      
      if (!isValidSize) {
        ElMessage.error('图片大小不能超过5MB')
        return false
      }
      
      selectedFile.value = file.raw
      previewImage.value = URL.createObjectURL(file.raw)
      return false // 阻止自动上传
    }
    
    // 移除头像
    const removeAvatar = () => {
      previewImage.value = null
      selectedFile.value = null
    }
    
    // 提交新角色
    const submitNewRole = () => {
      roleForm.value.validate(valid => {
        if (valid) {
          isSubmitting.value = true
          isGenerating.value = true
          progress.value = 10
          
          // 调用API
          createRole(
            newRoleForm.value.name,
            newRoleForm.value.description,
            selectedFile.value
          ).then(role => {
            progress.value = 100
            progressStatus.value = 'success'
            generationStatus.value = '角色信息生成成功！'
            
            // 短暂显示成功状态
            setTimeout(() => {
              // 添加成功，刷新角色列表
              roleStore.loadRoles()
              
              ElMessage({
                type: 'success',
                message: `角色 "${role.name}" 创建成功！`
              })
              
              resetForm()
              showAddRoleDialog.value = false
            }, 500)
          }).catch(error => {
            progress.value = 100
            progressStatus.value = 'exception'
            
            let errorMessage = '创建角色失败，请稍后重试'
            if (error.message) {
              errorMessage = error.message
            }
            
            // 如果是角色名称已存在错误
            if (errorMessage.includes('角色名称已存在')) {
              errorMessage = `角色名称 "${newRoleForm.value.name}" 已存在，请使用其他名称`
            }
            
            setTimeout(() => {
              ElMessage({
                type: 'error',
                message: errorMessage
              })
              isGenerating.value = false
            }, 500)
          }).finally(() => {
            isSubmitting.value = false
          })
        }
      })
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
      clearError,
      // 新增角色相关
      showAddRoleDialog,
      isSubmitting,
      isGenerating,
      progress,
      progressStatus,
      generationStatus,
      roleForm,
      newRoleForm,
      rules,
      handleDialogClose,
      submitNewRole,
      previewImage,
      handleAvatarChange,
      removeAvatar
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

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-box {
  max-width: 400px;
  flex: 1;
}

.add-role-btn {
  white-space: nowrap;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 25px;
  width: 100%;
  padding: 15px;
  grid-auto-rows: minmax(350px, auto);
  grid-auto-flow: row;
}

/* 响应式布局 */
@media (min-width: 1400px) {
  .roles-grid {
    grid-template-columns: repeat(5, minmax(200px, 1fr));
  }
}

@media (max-width: 1200px) {
  .roles-grid {
    grid-template-columns: repeat(4, minmax(200px, 1fr));
  }
}

@media (max-width: 992px) {
  .roles-grid {
    grid-template-columns: repeat(3, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .roles-grid {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}

@media (max-width: 576px) {
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

.generation-status {
  margin-top: 10px;
  color: #606266;
  font-size: 13px;
}

.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-hint {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.avatar-preview {
  position: relative;
  display: inline-block;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ebeef5;
}

.avatar-actions {
  margin-top: 10px;
}
</style>