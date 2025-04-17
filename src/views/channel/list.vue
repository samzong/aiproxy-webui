<template>
  <div class="channel-list-container">
    <div class="channel-header">
      <h1>渠道管理</h1>
      <div class="channel-actions">
        <el-button type="primary" @click="addChannel">添加渠道</el-button>
        <el-button type="danger" :disabled="selectedChannels.length === 0" @click="batchDeleteChannels">批量删除</el-button>
        <el-button type="primary" @click="refreshChannels">刷新</el-button>
        <el-button type="success" @click="testAllChannels" :loading="testAllLoading">测试所有渠道</el-button>
        <el-button type="warning" @click="updateAllChannelsBalance" :loading="updateAllLoading">更新所有余额</el-button>
      </div>
    </div>
    
    <div class="channel-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索渠道" clearable @keyup.enter="searchChannels" />
        </el-form-item>
        <el-form-item label="渠道类型">
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
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
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
          <span>{{ scope.row.balance ? scope.row.balance.toFixed(2) : '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已用金额" width="120">
        <template #default="scope">
          <span>{{ scope.row.used_amount ? scope.row.used_amount.toFixed(2) : '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="250">
        <template #default="scope">
          <el-button size="small" type="primary" @click="editChannel(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            :type="scope.row.status === 1 ? 'danger' : 'success'"
            @click="toggleChannelStatus(scope.row)"
          >
            {{ scope.row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" type="warning" @click="testChannel(scope.row)">测试</el-button>
          <el-button size="small" type="danger" @click="deleteChannel(scope.row)">删除</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  getChannels, 
  getChannelTypeNames, 
  updateChannelStatus, 
  deleteChannel as apiDeleteChannel,
  deleteChannels as apiDeleteChannels,
  searchChannels as apiSearchChannels,
  testAllChannels as apiTestAllChannels,
  testChannel as apiTestChannel,
  updateAllChannelsBalance as apiUpdateAllChannelsBalance
} from '@/api/channel'

const router = useRouter()
const loading = ref(false)
const testAllLoading = ref(false)
const updateAllLoading = ref(false)
const channels = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedChannels = ref([])
const channelTypeNames = ref({})

const searchForm = reactive({
  keyword: '',
  channel_type: '',
})

// 加载渠道列表
const loadChannels = async () => {
  loading.value = true
  try {
    const res = await getChannels({
      page: currentPage.value,
      per_page: pageSize.value
    })
    channels.value = res.data.channels
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取渠道列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载渠道类型名称
const loadChannelTypeNames = async () => {
  try {
    const res = await getChannelTypeNames()
    channelTypeNames.value = res.data
  } catch (error) {
    ElMessage.error('获取渠道类型失败')
    console.error(error)
  }
}

// 添加渠道
const addChannel = () => {
  router.push('/channel/add')
}

// 编辑渠道
const editChannel = (channel) => {
  router.push(`/channel/add?id=${channel.id}`)
}

// 删除渠道
const deleteChannel = (channel) => {
  ElMessageBox.confirm(
    `确定要删除渠道 "${channel.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await apiDeleteChannel(channel.id)
      ElMessage.success('删除成功')
      loadChannels()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 批量删除渠道
const batchDeleteChannels = () => {
  if (selectedChannels.value.length === 0) {
    ElMessage.warning('请选择要删除的渠道')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedChannels.value.length} 个渠道吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const ids = selectedChannels.value.map(item => item.id)
      await apiDeleteChannels(ids)
      ElMessage.success('批量删除成功')
      loadChannels()
    } catch (error) {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 切换渠道状态
const toggleChannelStatus = async (channel) => {
  const newStatus = channel.status === 1 ? 2 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await updateChannelStatus(channel.id, { status: newStatus })
    ElMessage.success(`${statusText}成功`)
    // 更新本地数据
    const index = channels.value.findIndex(item => item.id === channel.id)
    if (index !== -1) {
      channels.value[index].status = newStatus
    }
  } catch (error) {
    ElMessage.error(`${statusText}失败`)
    console.error(error)
  }
}

// 测试渠道
const testChannel = async (channel) => {
  try {
    ElMessage.info(`正在测试渠道 "${channel.name}"...`)
    await apiTestChannel(channel.id)
    ElMessage.success(`渠道 "${channel.name}" 测试成功`)
  } catch (error) {
    ElMessage.error(`渠道 "${channel.name}" 测试失败`)
    console.error(error)
  }
}

// 测试所有渠道
const testAllChannels = async () => {
  testAllLoading.value = true
  try {
    ElMessage.info('正在测试所有渠道...')
    await apiTestAllChannels()
    ElMessage.success('测试所有渠道完成')
  } catch (error) {
    ElMessage.error('测试所有渠道失败')
    console.error(error)
  } finally {
    testAllLoading.value = false
  }
}

// 更新所有渠道余额
const updateAllChannelsBalance = async () => {
  updateAllLoading.value = true
  try {
    ElMessage.info('正在更新所有渠道余额...')
    await apiUpdateAllChannelsBalance()
    ElMessage.success('更新所有渠道余额完成')
    // 刷新列表
    loadChannels()
  } catch (error) {
    ElMessage.error('更新所有渠道余额失败')
    console.error(error)
  } finally {
    updateAllLoading.value = false
  }
}

// 选择项变化
const handleSelectionChange = (val) => {
  selectedChannels.value = val
}

// 刷新列表
const refreshChannels = () => {
  loadChannels()
}

// 搜索渠道
const searchChannels = async () => {
  loading.value = true
  try {
    const res = await apiSearchChannels({
      keyword: searchForm.keyword,
      channel_type: searchForm.channel_type,
      page: currentPage.value,
      per_page: pageSize.value
    })
    channels.value = res.data.channels
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('搜索失败')
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

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadChannels()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadChannels()
}

onMounted(() => {
  loadChannels()
  loadChannelTypeNames()
})
</script>

<style scoped>
.channel-list-container {
  padding: 20px;
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.channel-search {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 