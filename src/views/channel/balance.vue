<template>
  <div class="channel-balance-container">
    <div class="channel-balance-header">
      <h1>通道余额管理</h1>
      <div class="channel-balance-actions">
        <el-button type="primary" @click="updateAllBalances" :loading="updateAllLoading">更新所有余额</el-button>
        <el-button type="primary" @click="refreshChannels">刷新</el-button>
      </div>
    </div>
    
    <div class="channel-balance-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索通道" clearable @keyup.enter="searchChannels" />
        </el-form-item>
        <el-form-item label="通道类型">
          <el-select v-model="searchForm.channel_type" placeholder="选择类型" clearable>
            <el-option
              v-for="(name, type) in channelTypeNames"
              :key="type"
              :label="name"
              :value="Number(type)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchChannels">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table
      v-loading="loading"
      :data="channels"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column label="类型" min-width="120">
        <template #default="scope">
          {{ channelTypeNames[scope.row.type] || `未知类型(${scope.row.type})` }}
        </template>
      </el-table-column>
      <el-table-column prop="base_url" label="基础URL" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="余额" width="120">
        <template #default="scope">
          <span>{{ formatAmount(scope.row.balance) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已用金额" width="120">
        <template #default="scope">
          <span>{{ formatAmount(scope.row.used_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="余额警报阈值" width="150">
        <template #default="scope">
          <div class="threshold-container">
            <span class="threshold-value">{{ formatAmount(scope.row.balance_threshold) }}</span>
            <el-switch
              v-model="scope.row.enabled_balance_alert"
              :disabled="updatingAlertSettingsId === scope.row.id"
              @change="(val) => toggleBalanceAlert(scope.row, val)"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="自动更新余额" width="150">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled_auto_balance_check"
            :disabled="updatingBalanceCheckId === scope.row.id"
            @change="(val) => toggleAutoBalanceCheck(scope.row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="最后更新时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.balance_updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="scope">
          <el-button size="small" type="primary" :loading="scope.row.updating" @click="updateBalance(scope.row)">更新余额</el-button>
          <el-button size="small" type="warning" @click="showThresholdDialog(scope.row)">设置阈值</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 设置阈值对话框 -->
    <el-dialog
      v-model="thresholdDialogVisible"
      title="设置余额警报阈值"
      width="500px"
    >
      <el-form :model="thresholdForm" label-width="120px" ref="thresholdFormRef">
        <el-form-item label="启用余额警报">
          <el-switch v-model="thresholdForm.enabled_balance_alert" />
        </el-form-item>
        
        <el-form-item label="余额警报阈值" v-if="thresholdForm.enabled_balance_alert">
          <el-input-number v-model="thresholdForm.balance_threshold" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="thresholdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveThreshold" :loading="saveThresholdLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getChannels, 
  getChannelTypeNames, 
  searchChannels as apiSearchChannels,
  updateChannelBalance as apiUpdateChannelBalance,
  updateAllChannelsBalance as apiUpdateAllChannelsBalance,
  updateChannelBalanceAlert,
  updateChannelAutoBalanceCheck
} from '@/api/channel'

// 状态变量
const loading = ref(false)
const updateAllLoading = ref(false)
const channels = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const channelTypeNames = ref({})
const thresholdDialogVisible = ref(false)
const saveThresholdLoading = ref(false)
const updatingAlertSettingsId = ref(null)
const updatingBalanceCheckId = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  channel_type: '',
})

// 设置阈值表单
const thresholdForm = reactive({
  id: null,
  enabled_balance_alert: false,
  balance_threshold: 0,
})

// 加载通道列表
const loadChannels = async () => {
  if (loading.value) return // 防止重复加载
  
  loading.value = true
  try {
    const res = await getChannels({
      page: currentPage.value,
      per_page: pageSize.value
    })
    
    if (res.data && res.data.channels) {
      channels.value = res.data.channels.map(channel => ({
        ...channel,
        updating: false
      }))
      total.value = res.data.total
    } else {
      ElMessage.error('获取通道列表失败：数据格式错误')
    }
  } catch (error) {
    ElMessage.error('获取通道列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载通道类型名称
const loadChannelTypeNames = async () => {
  try {
    const res = await getChannelTypeNames()
    if (res.data) {
      channelTypeNames.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取通道类型失败')
    console.error(error)
  }
}

// 搜索通道
const searchChannels = async () => {
  if (loading.value) return
  
  currentPage.value = 1
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      per_page: pageSize.value,
      keyword: searchForm.keyword,
      channel_type: searchForm.channel_type
    }
    
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const res = await apiSearchChannels(params)
    if (res.data && res.data.channels) {
      channels.value = res.data.channels.map(channel => ({
        ...channel,
        updating: false
      }))
      total.value = res.data.total
    } else {
      ElMessage.error('搜索通道失败：数据格式错误')
    }
  } catch (error) {
    ElMessage.error('搜索通道失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.channel_type = ''
  loadChannels()
}

// 更新单个通道余额
const updateBalance = async (channel) => {
  // 设置更新状态
  const index = channels.value.findIndex(c => c.id === channel.id)
  if (index !== -1) {
    channels.value[index].updating = true
  }
  
  try {
    const res = await apiUpdateChannelBalance(channel.id)
    if (res.data !== undefined) {
      // 更新通道余额
      if (index !== -1) {
        channels.value[index].balance = res.data
        channels.value[index].balance_updated_at = new Date().getTime()
      }
      ElMessage.success(`通道 "${channel.name}" 余额更新成功`)
    } else {
      ElMessage.error(`通道 "${channel.name}" 余额更新失败`)
    }
  } catch (error) {
    ElMessage.error(`通道 "${channel.name}" 余额更新失败`)
    console.error(error)
  } finally {
    // 清除更新状态
    if (index !== -1) {
      channels.value[index].updating = false
    }
  }
}

// 更新所有通道余额
const updateAllBalances = async () => {
  updateAllLoading.value = true
  
  try {
    await apiUpdateAllChannelsBalance()
    ElMessage.success('所有通道余额更新成功')
    refreshChannels()
  } catch (error) {
    ElMessage.error('更新所有通道余额失败')
    console.error(error)
  } finally {
    updateAllLoading.value = false
  }
}

// 刷新通道列表
const refreshChannels = () => {
  loadChannels()
}

// 设置余额警报阈值对话框
const showThresholdDialog = (channel) => {
  thresholdForm.id = channel.id
  thresholdForm.enabled_balance_alert = channel.enabled_balance_alert || false
  thresholdForm.balance_threshold = channel.balance_threshold || 0
  thresholdDialogVisible.value = true
}

// 保存阈值设置
const saveThreshold = async () => {
  if (!thresholdForm.id) return
  
  saveThresholdLoading.value = true
  
  try {
    await updateChannelBalanceAlert(thresholdForm.id, {
      enabled_balance_alert: thresholdForm.enabled_balance_alert,
      balance_threshold: thresholdForm.balance_threshold
    })
    
    // 更新本地数据
    const index = channels.value.findIndex(c => c.id === thresholdForm.id)
    if (index !== -1) {
      channels.value[index].enabled_balance_alert = thresholdForm.enabled_balance_alert
      channels.value[index].balance_threshold = thresholdForm.balance_threshold
    }
    
    ElMessage.success('余额警报阈值设置成功')
    thresholdDialogVisible.value = false
  } catch (error) {
    ElMessage.error('余额警报阈值设置失败')
    console.error(error)
  } finally {
    saveThresholdLoading.value = false
  }
}

// 切换余额警报
const toggleBalanceAlert = async (channel, value) => {
  updatingAlertSettingsId.value = channel.id
  
  try {
    await updateChannelBalanceAlert(channel.id, {
      enabled_balance_alert: value,
      balance_threshold: channel.balance_threshold || 0
    })
    ElMessage.success(`${value ? '启用' : '禁用'}余额警报成功`)
  } catch (error) {
    // 恢复原来的状态
    const index = channels.value.findIndex(c => c.id === channel.id)
    if (index !== -1) {
      channels.value[index].enabled_balance_alert = !value
    }
    ElMessage.error(`${value ? '启用' : '禁用'}余额警报失败`)
    console.error(error)
  } finally {
    updatingAlertSettingsId.value = null
  }
}

// 切换自动余额检查
const toggleAutoBalanceCheck = async (channel, value) => {
  updatingBalanceCheckId.value = channel.id
  
  try {
    await updateChannelAutoBalanceCheck(channel.id, {
      enabled_auto_balance_check: value
    })
    ElMessage.success(`${value ? '启用' : '禁用'}自动余额检查成功`)
  } catch (error) {
    // 恢复原来的状态
    const index = channels.value.findIndex(c => c.id === channel.id)
    if (index !== -1) {
      channels.value[index].enabled_auto_balance_check = !value
    }
    ElMessage.error(`${value ? '启用' : '禁用'}自动余额检查失败`)
    console.error(error)
  } finally {
    updatingBalanceCheckId.value = null
  }
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  loadChannels()
}

// 处理页数变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  loadChannels()
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '从未更新'
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

// 格式化金额
const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0.00'
  return Number(amount).toFixed(2)
}

// 生命周期钩子
onMounted(() => {
  loadChannels()
  loadChannelTypeNames()
})

onActivated(() => {
  loadChannels()
})
</script>

<style scoped>
.channel-balance-container {
  padding: 20px;
}

.channel-balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.channel-balance-header h1 {
  margin: 0;
  font-size: 24px;
}

.channel-balance-actions {
  display: flex;
  gap: 10px;
}

.channel-balance-search {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.threshold-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.threshold-value {
  margin-right: 10px;
}
</style> 