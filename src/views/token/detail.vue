<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>Token 详情</span>
          <div class="header-actions">
            <el-button type="primary" @click="editToken">编辑</el-button>
            <el-button type="primary" @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <div v-loading="loading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ tokenDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ tokenDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="密钥">
            <div class="key-container">
              <span>{{ tokenDetail.key }}</span>
              <el-button type="primary" link @click="copyKey">复制</el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="分组">{{ tokenDetail.group_id }}</el-descriptions-item>
          <el-descriptions-item label="模型限制">
            <div v-if="tokenDetail.models && tokenDetail.models.length">
              <el-tag 
                v-for="model in tokenDetail.models" 
                :key="model" 
                class="model-tag"
                type="info"
              >
                {{ model }}
              </el-tag>
            </div>
            <span v-else>无限制</span>
          </el-descriptions-item>
          <el-descriptions-item label="子网限制">
            <div v-if="tokenDetail.subnets && tokenDetail.subnets.length">
              <el-tag 
                v-for="subnet in tokenDetail.subnets" 
                :key="subnet" 
                class="subnet-tag"
                type="info"
              >
                {{ subnet }}
              </el-tag>
            </div>
            <span v-else>无限制</span>
          </el-descriptions-item>
          <el-descriptions-item label="配额">
            <div class="quota-container">
              {{ formatQuota(tokenDetail.quota) }}
              <el-button type="primary" link @click="openQuotaDialog">
                <el-icon><Edit /></el-icon>
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="已使用配额">
            <div class="quota-container">
              {{ formatQuota(tokenDetail.used_quota) }}
              <el-button 
                type="primary" 
                link 
                @click="resetQuota" 
                :disabled="!tokenDetail.used_quota"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="剩余配额">
            <span :class="getQuotaClass">
              {{ formatRemainingQuota }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="配额告警">
            <div class="alarm-container">
              <el-tag :type="tokenDetail.alert_enabled ? 'success' : 'info'">
                {{ tokenDetail.alert_enabled ? '已启用' : '未启用' }}
              </el-tag>
              <template v-if="tokenDetail.alert_enabled">
                <span class="alarm-threshold">阈值: {{ formatQuota(tokenDetail.alert_threshold) }}</span>
              </template>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="tokenDetail.status === 1 ? 'success' : 'danger'">
              {{ tokenDetail.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(tokenDetail.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="过期时间">
            {{ tokenDetail.expired_at ? formatDate(tokenDetail.expired_at) : '永不过期' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后访问时间">
            {{ tokenDetail.accessed_at ? formatDate(tokenDetail.accessed_at) : '从未访问' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="action-buttons">
          <el-button 
            :type="tokenDetail.status === 1 ? 'danger' : 'success'"
            @click="toggleStatus"
            :loading="actionLoading"
          >
            {{ tokenDetail.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button 
            type="danger" 
            @click="deleteToken"
            :loading="actionLoading"
          >
            删除
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 配额更新对话框 -->
    <el-dialog
      v-model="quotaDialogVisible"
      title="更新 Token 配额"
      width="500px"
    >
      <el-form :model="quotaForm" label-width="100px" :rules="quotaRules" ref="quotaFormRef">
        <el-form-item label="Token">
          <el-input v-model="quotaForm.name" disabled />
        </el-form-item>
        <el-form-item label="当前配额">
          <el-input v-model="formattedCurrentQuota" disabled />
        </el-form-item>
        <el-form-item label="已使用">
          <el-input v-model="formattedUsedQuota" disabled />
        </el-form-item>
        <el-form-item label="剩余配额">
          <el-input v-model="formattedRemainingQuota" disabled />
        </el-form-item>
        <el-form-item label="新配额" prop="quota">
          <el-input-number 
            v-model="quotaForm.quota" 
            :min="0" 
            :precision="2" 
            :step="10" 
            style="width: 100%" 
            placeholder="设置为 0 表示无限制"
          />
        </el-form-item>
        <el-divider content-position="left">配额告警设置</el-divider>
        <el-form-item label="启用告警">
          <el-switch v-model="quotaForm.alert_enabled" />
        </el-form-item>
        <el-form-item label="告警阈值" v-if="quotaForm.alert_enabled">
          <el-input-number 
            v-model="quotaForm.alert_threshold" 
            :min="0" 
            :precision="2" 
            :step="10" 
            style="width: 100%" 
            placeholder="设置告警阈值"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="quotaDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitQuotaUpdate" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getTokenById, 
  deleteToken as apiDeleteToken, 
  updateTokenStatus, 
  updateToken, 
  resetTokenUsedQuota as apiResetTokenUsedQuota 
} from '@/api/token'
import { Edit, Delete } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const tokenId = route.params.id
const loading = ref(true)
const actionLoading = ref(false)
const submitLoading = ref(false)
const tokenDetail = ref({})

// 配额对话框
const quotaDialogVisible = ref(false)
const quotaFormRef = ref(null)
const quotaForm = reactive({
  id: null,
  name: '',
  group_id: '',
  quota: 0,
  used_quota: 0,
  alert_enabled: false,
  alert_threshold: 0
})

// 配额验证规则
const quotaRules = {
  quota: [
    { required: true, message: '请输入配额值', trigger: 'blur' }
  ]
}

// 获取 Token 详情
const loadToken = async () => {
  loading.value = true
  try {
    const res = await getTokenById(tokenId)
    tokenDetail.value = res.data
  } catch (error) {
    ElMessage.error('获取 Token 详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 返回列表页
const goBack = () => {
  router.push('/token/list')
}

// 复制密钥
const copyKey = () => {
  if (!tokenDetail.value.key) {
    ElMessage.warning('无可复制的密钥')
    return
  }
  
  navigator.clipboard.writeText(tokenDetail.value.key)
    .then(() => {
      ElMessage.success('密钥已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 编辑 Token
const editToken = () => {
  router.push(`/token/add?id=${tokenId}`)
}

// 切换状态
const toggleStatus = async () => {
  const newStatus = tokenDetail.value.status === 1 ? 2 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  ElMessageBox.confirm(`确定要${statusText}该 Token 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    actionLoading.value = true
    try {
      await updateTokenStatus(tokenId, { status: newStatus })
      ElMessage.success(`${statusText}成功`)
      // 更新本地数据
      tokenDetail.value.status = newStatus
    } catch (error) {
      ElMessage.error(`${statusText}失败`)
      console.error(error)
    } finally {
      actionLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 删除 Token
const deleteToken = () => {
  ElMessageBox.confirm(`确定要删除该 Token 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    actionLoading.value = true
    try {
      await apiDeleteToken(tokenId)
      ElMessage.success('删除成功')
      router.push('/token/list')
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    } finally {
      actionLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 打开配额设置对话框
const openQuotaDialog = () => {
  quotaForm.id = tokenDetail.value.id
  quotaForm.name = tokenDetail.value.name
  quotaForm.group_id = tokenDetail.value.group_id
  quotaForm.quota = tokenDetail.value.quota || 0
  quotaForm.used_quota = tokenDetail.value.used_quota || 0
  quotaForm.alert_enabled = tokenDetail.value.alert_enabled || false
  quotaForm.alert_threshold = tokenDetail.value.alert_threshold || 0
  
  quotaDialogVisible.value = true
}

// 更新配额
const submitQuotaUpdate = async () => {
  quotaFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      // 准备更新的数据
      const updateData = {
        quota: quotaForm.quota,
        alert_enabled: quotaForm.alert_enabled,
        alert_threshold: quotaForm.alert_threshold
      }
      
      await updateToken(tokenId, updateData)
      ElMessage.success('配额更新成功')
      quotaDialogVisible.value = false
      
      // 更新本地数据
      tokenDetail.value.quota = quotaForm.quota
      tokenDetail.value.alert_enabled = quotaForm.alert_enabled
      tokenDetail.value.alert_threshold = quotaForm.alert_threshold
      
    } catch (error) {
      ElMessage.error('配额更新失败')
      console.error(error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 重置使用量
const resetQuota = () => {
  if (!tokenDetail.value.used_quota) {
    ElMessage.warning('当前使用量已经为 0，无需重置')
    return
  }
  
  ElMessageBox.confirm('确定要重置此 Token 的使用量吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    actionLoading.value = true
    try {
      await apiResetTokenUsedQuota(tokenId)
      ElMessage.success('使用量重置成功')
      
      // 更新本地数据
      tokenDetail.value.used_quota = 0
    } catch (error) {
      ElMessage.error('使用量重置失败')
      console.error(error)
    } finally {
      actionLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

// 格式化配额数值
const formatQuota = (quota) => {
  if (quota === 0 || quota === undefined || quota === null) {
    return '无限制'
  }
  return quota.toFixed(2)
}

// 计算剩余配额
const formatRemainingQuota = computed(() => {
  const quota = tokenDetail.value.quota || 0
  const usedQuota = tokenDetail.value.used_quota || 0
  
  if (quota === 0) {
    return '无限制'
  }
  
  const remaining = quota - usedQuota
  return remaining.toFixed(2)
})

// 获取配额的样式类
const getQuotaClass = computed(() => {
  const quota = tokenDetail.value.quota || 0
  const usedQuota = tokenDetail.value.used_quota || 0
  
  if (quota === 0) return ''
  
  const remaining = quota - usedQuota
  const percentage = (remaining / quota) * 100
  
  if (percentage <= 10) return 'quota-critical'
  if (percentage <= 30) return 'quota-warning'
  return 'quota-normal'
})

// 计算属性 - 格式化的配额值
const formattedCurrentQuota = computed(() => {
  return formatQuota(quotaForm.quota)
})

const formattedUsedQuota = computed(() => {
  return formatQuota(quotaForm.used_quota)
})

const formattedRemainingQuota = computed(() => {
  const quota = quotaForm.quota || 0
  const usedQuota = quotaForm.used_quota || 0
  
  if (quota === 0) {
    return '无限制'
  }
  
  const remaining = quota - usedQuota
  return remaining.toFixed(2)
})

onMounted(() => {
  loadToken()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.key-container,
.quota-container,
.alarm-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alarm-threshold {
  margin-left: 10px;
  color: #606266;
}

.model-tag,
.subnet-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.quota-normal {
  color: #67c23a;
}

.quota-warning {
  color: #e6a23c;
}

.quota-critical {
  color: #f56c6c;
}
</style> 