<template>
  <div class="role-edit-container">
    <header class="header">
      <el-button type="info" icon="Back" @click="goBack" circle />
      <h1 class="title">{{ isEditMode ? '编辑角色' : '创建新角色' }}</h1>
    </header>
    
    <div class="content">
      <el-form 
        :model="roleForm" 
        :rules="rules" 
        ref="formRef"
        label-width="120px"
        class="role-form"
      >
        <!-- 角色名称 -->
        <el-form-item label="角色名称" prop="name">
          <el-input 
            v-model="roleForm.name" 
            placeholder="例如：哈利·波特" 
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 角色描述 -->
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="roleForm.description" 
            type="textarea"
            :rows="4"
            placeholder="简要描述角色特点，例如：霍格沃茨四年级学生，勇敢正义" 
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 角色头像 -->
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
              <el-button type="danger" size="small" @click="resetToDefault">恢复默认</el-button>
            </div>
          </div>
        </el-form-item>
        
        <!-- AI生成状态 -->
        <el-form-item label="AI生成中" v-if="isGenerating">
          <el-progress :percentage="progress" :indeterminate="true" :status="progressStatus" />
          <p class="generation-status">{{ generationStatus }}</p>
        </el-form-item>
        
        <!-- 角色类型（只读） -->
        <el-form-item label="角色类型" v-if="isEditMode && roleForm.archetype">
          <el-tag type="info">{{ roleForm.archetype }}</el-tag>
        </el-form-item>
        
        <!-- 系统提示词（高级模式） -->
        <el-form-item label="系统提示词" v-if="showSystemPrompt">
          <el-input 
            v-model="roleForm.systemPrompt" 
            type="textarea"
            :rows="8"
            placeholder="AI角色的系统提示词，定义角色行为和回复方式"
          />
          <p class="prompt-hint">提示：此字段定义AI如何扮演角色，包含角色身份、知识范围、回复风格等</p>
        </el-form-item>
        
        <!-- 高级选项 -->
        <el-form-item>
          <el-button type="info" @click="toggleSystemPrompt" size="small">
            {{ showSystemPrompt ? '隐藏高级设置' : '显示高级设置' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <footer class="footer">
      <el-button @click="goBack">取消</el-button>
      <el-button 
        type="primary" 
        @click="submitRole" 
        :loading="isSubmitting"
        :disabled="isGenerating"
      >
        {{ isEditMode ? '保存更改' : '创建角色' }}
      </el-button>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoleStore } from '@/stores/roleStore'
import { createRole, fetchRoleById } from '@/utils/api/role'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roleStore = useRoleStore()
    
    const formRef = ref(null)
    const roleForm = ref({
      name: '',
      description: '',
      archetype: '',
      systemPrompt: ''
    })
    
    const previewImage = ref(null)
    const selectedFile = ref(null)
    const isEditMode = computed(() => !!route.params.id)
    const roleId = computed(() => route.params.id ? parseInt(route.params.id) : null)
    
    const isSubmitting = ref(false)
    const isGenerating = ref(false)
    const progress = ref(0)
    const progressStatus = ref('warning')
    const generationStatus = ref('AI正在生成角色信息...')
    const showSystemPrompt = ref(false)
    
    // 表单验证规则
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
    
    // 初始化
    onMounted(async () => {
      if (isEditMode.value) {
        try {
          // 加载角色数据
          const role = await fetchRoleById(roleId.value)
          roleForm.value = { ...role }
          
          // 设置头像预览
          if (role.avatarUrl && !role.avatarUrl.includes('/default/')) {
            previewImage.value = role.avatarUrl
          }
        } catch (error) {
          ElMessage.error('加载角色数据失败')
          goBack()
        }
      }
    })
    
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
    
    // 重置为默认头像
    const resetToDefault = () => {
      previewImage.value = null
      selectedFile.value = null
    }
    
    // 切换高级设置
    const toggleSystemPrompt = () => {
      showSystemPrompt.value = !showSystemPrompt.value
    }
    
    // 提交角色
    const submitRole = () => {
      formRef.value.validate(valid => {
        if (valid) {
          isSubmitting.value = true
          
          if (isEditMode.value) {
            // 编辑模式 - 暂不实现编辑API
            ElMessageBox.confirm('角色编辑功能尚未实现，是否创建新角色？', '提示', {
              confirmButtonText: '创建新角色',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              // 转为创建模式
              isEditMode.value = false
              createNewRole()
            }).catch(() => {
              isSubmitting.value = false
            })
          } else {
            createNewRole()
          }
        }
      })
    }
    
    // 创建新角色
    const createNewRole = () => {
      isGenerating.value = true
      progress.value = 10
      
      // 模拟AI生成过程
      const progressInterval = setInterval(() => {
        if (progress.value < 90) {
          progress.value += 5
        }
      }, 300)
      
      // 调用API
      createRole(
        roleForm.value.name,
        roleForm.value.description,
        selectedFile.value
      ).then(role => {
        clearInterval(progressInterval)
        progress.value = 100
        progressStatus.value = 'success'
        generationStatus.value = '角色创建成功！'
        
        // 刷新角色列表
        roleStore.loadRoles()
        
        setTimeout(() => {
          ElMessage({
            type: 'success',
            message: `角色 "${role.name}" 创建成功！`
          })
          
          goBack()
        }, 500)
      }).catch(error => {
        clearInterval(progressInterval)
        progress.value = 100
        progressStatus.value = 'exception'
        
        let errorMessage = '创建角色失败，请稍后重试'
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        }
        
        // 如果是角色名称已存在错误
        if (errorMessage.includes('角色名称已存在')) {
          errorMessage = `角色名称 "${roleForm.value.name}" 已存在，请使用其他名称`
        }
        
        setTimeout(() => {
          ElMessage({
            type: 'error',
            message: errorMessage
          })
          isGenerating.value = false
          isSubmitting.value = false
        }, 500)
      })
    }
    
    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    return {
      formRef,
      roleForm,
      previewImage,
      selectedFile,
      isEditMode,
      isSubmitting,
      isGenerating,
      progress,
      progressStatus,
      generationStatus,
      showSystemPrompt,
      rules,
      handleAvatarChange,
      removeAvatar,
      resetToDefault,
      toggleSystemPrompt,
      submitRole,
      goBack
    }
  }
}
</script>

<style scoped>
.role-edit-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.title {
  margin-left: 15px;
  font-size: 1.5rem;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.role-form {
  max-width: 600px;
  margin: 0 auto;
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
  display: flex;
  gap: 10px;
}

.generation-status {
  margin-top: 10px;
  color: #606266;
  font-size: 13px;
}

.prompt-hint {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #ebeef5;
}
</style>