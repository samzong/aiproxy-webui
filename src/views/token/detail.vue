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
            {{ tokenDetail.quota ? tokenDetail.quota.toFixed(2) : '无限制' }}
          </el-descriptions-item>
          <el-descriptions-item label="剩余配额">
            {{ tokenDetail.remaining_quota ? tokenDetail.remaining_quota.toFixed(2) : '无限制' }}
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTokenById, deleteToken as apiDeleteToken, updateTokenStatus } from '@/api/token'

const route = useRoute()
const router = useRouter()
const tokenId = route.params.id
const loading = ref(true)
const actionLoading = ref(false)
const tokenDetail = ref({})

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

.key-container {
  display: flex;
  align-items: center;
  gap: 10px;
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
</style> 