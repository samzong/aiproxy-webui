<template>
  <div class="login-container">
    <div class="login-form-container">
      <div class="login-title">
        <h2>AI Proxy 管理平台</h2>
      </div>
      
      <el-form ref="formRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="adminKey">
          <el-input
            v-model="loginForm.adminKey"
            type="password"
            placeholder="请输入 Admin Key"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <p>* 请使用 Admin Key 登录管理平台</p>
        <p>* Admin Key 在环境变量 ADMIN_KEY 中配置</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const formRef = ref(null)

const loginForm = reactive({
  adminKey: ''
})

const loginRules = {
  adminKey: [
    { required: true, message: '请输入Admin Key', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const result = await userStore.login(loginForm.adminKey)
      
      if (result) {
        ElMessage({
          message: '登录成功',
          type: 'success'
        })
        
        router.push({ path: '/' })
      } else {
        ElMessage.error('登录失败，请检查Admin Key是否正确')
      }
    } catch (error) {
      console.error('登录异常:', error)
      ElMessage.error('登录异常，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-form-container {
  width: 360px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  font-weight: 500;
  color: #303133;
}

.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}

.login-tips {
  font-size: 12px;
  color: #909399;
  margin-top: 20px;
}

.login-tips p {
  margin: 5px 0;
}
</style> 