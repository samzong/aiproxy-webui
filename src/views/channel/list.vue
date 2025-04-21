<template>
  <div class="channel-list-container">
    <div class="channel-header">
      <h1>渠道管理</h1>
      <div class="channel-actions">
        <el-button type="primary" icon="Plus" @click="addChannel">添加渠道</el-button>
        <el-button type="danger" icon="Delete" :disabled="selectedChannels.length === 0" @click="batchDeleteChannels">批量删除</el-button>
        <el-dropdown split-button type="primary" @command="handleCommand">
          更多操作
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="refresh" icon="Refresh">刷新列表</el-dropdown-item>
              <el-dropdown-item command="testAll" icon="Check" :disabled="testAllLoading">测试所有渠道</el-dropdown-item>
              <el-dropdown-item command="updateBalance" icon="Money" :disabled="updateAllLoading">更新所有余额</el-dropdown-item>
              <el-dropdown-item command="exportChannels" icon="Download">导出数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="channel-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="搜索名称/ID/URL" 
            clearable 
            prefix-icon="Search"
            @keyup.enter="searchChannels" 
          />
        </el-form-item>
        <el-form-item label="渠道类型">
          <el-select v-model="searchForm.channel_type" placeholder="所有类型" clearable style="width: 160px;">
            <el-option
              v-for="(name, type) in channelTypeNames"
              :key="type"
              :label="name"
              :value="Number(type)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="所有状态" clearable style="width: 120px;">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="searchForm.order" placeholder="默认排序" clearable style="width: 150px;">
            <el-option label="ID升序" value="id asc" />
            <el-option label="ID降序" value="id desc" />
            <el-option label="创建时间升序" value="created_at asc" />
            <el-option label="创建时间降序" value="created_at desc" />
            <el-option label="优先级升序" value="priority asc" />
            <el-option label="优先级降序" value="priority desc" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchChannels">搜索</el-button>
          <el-button icon="RefreshRight" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table
      v-loading="loading"
      :data="channels"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
      stripe
      highlight-current-row
      ref="channelTable"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
      <el-table-column label="类型" width="120">
        <template #default="scope">
          <el-tag type="info">
            {{ channelTypeNames[scope.row.type] || `未知类型(${scope.row.type})` }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="base_url" label="基础URL" min-width="180" show-overflow-tooltip />
      <el-table-column prop="priority" label="优先级" width="100" sortable>
        <template #default="scope">
          <el-tag type="success" effect="plain" size="small">{{ scope.row.priority || 10 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" :filters="[
        { text: '启用', value: 1 },
        { text: '禁用', value: 2 }
      ]" :filter-method="filterStatus" filter-placement="bottom">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="余额" width="120" sortable>
        <template #default="scope">
          <span :class="{ 'low-balance': scope.row.balance < 10 }">
            $ {{ scope.row.balance ? scope.row.balance.toFixed(2) : '0.00' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="已用金额" width="120" sortable>
        <template #default="scope">
          <span>$ {{ scope.row.used_amount ? scope.row.used_amount.toFixed(2) : '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="模型数量" width="100">
        <template #default="scope">
          <el-tooltip 
            effect="dark" 
            :content="scope.row.models && scope.row.models.length > 0 ? scope.row.models.join(', ') : '无模型'" 
            placement="top"
          >
            <el-badge :value="scope.row.models ? scope.row.models.length : 0" type="info" />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" type="primary" @click="editChannel(scope.row)" title="编辑">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'danger' : 'success'"
              @click="toggleChannelStatus(scope.row)"
              :title="scope.row.status === 1 ? '禁用' : '启用'"
            >
              <el-icon v-if="scope.row.status === 1"><Close /></el-icon>
              <el-icon v-else><Check /></el-icon>
            </el-button>
            <el-button size="small" type="warning" @click="testChannel(scope.row)" title="测试">
              <el-icon><Connection /></el-icon>
            </el-button>
            <el-button size="small" type="info" @click="updateChannelBalance(scope.row)" title="更新余额">
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="deleteChannel(scope.row)" title="删除">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
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
    
    <!-- 添加渠道表单对话框 -->
    <ChannelFormDialog
      v-model:visible="dialogVisible"
      :channel="currentChannel"
      :is-edit="Boolean(currentChannel.id)"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import ChannelFormDialog from './ChannelFormDialog.vue'
import { 
  getChannels, 
  getChannelTypeNames, 
  updateChannelStatus, 
  deleteChannel as apiDeleteChannel,
  deleteChannels as apiDeleteChannels,
  searchChannels as apiSearchChannels,
  testAllChannels as apiTestAllChannels,
  testChannel as apiTestChannel,
  updateAllChannelsBalance as apiUpdateAllChannelsBalance,
  updateChannelBalance as apiUpdateChannelBalance,
  getChannelById
} from '@/api/channel'
import { Plus, Delete, Refresh, Check, Money, Download, Search, RefreshRight, Edit, Close, Connection } from '@element-plus/icons-vue'

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
const channelTable = ref(null)
const dialogVisible = ref(false)
const currentChannel = ref({})

const searchForm = reactive({
  keyword: '',
  channel_type: '',
  status: '',
  order: '',
})

// 加载渠道列表
const loadChannels = async () => {
  if (loading.value) return // 防止重复加载
  
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    // 添加排序参数
    if (searchForm.order) {
      params.order = searchForm.order
    }
    
    const res = await getChannels(params)
    
    if (res.data && res.data.channels) {
      channels.value = res.data.channels
      total.value = res.data.total
    } else {
      ElMessage.warning('获取渠道数据格式异常')
    }
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
  currentChannel.value = {}
  dialogVisible.value = true
}

// 编辑渠道
const editChannel = (channel) => {
  currentChannel.value = { ...channel }
  dialogVisible.value = true
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
      status: searchForm.status,
      order: searchForm.order,
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
  searchForm.status = ''
  searchForm.order = ''
  
  // 重置表格筛选
  if (channelTable.value) {
    channelTable.value.clearFilter()
  }
  
  // 重新加载数据
  currentPage.value = 1
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

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'refresh':
      refreshChannels()
      break
    case 'testAll':
      testAllChannels()
      break
    case 'updateBalance':
      updateAllChannelsBalance()
      break
    case 'exportChannels':
      exportChannels()
      break
  }
}

// 导出渠道数据
const exportChannels = () => {
  if (channels.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  
  try {
    // 准备导出数据
    const exportData = channels.value.map(channel => ({
      ID: channel.id,
      名称: channel.name,
      类型: channelTypeNames.value[channel.type] || `未知类型(${channel.type})`,
      基础URL: channel.base_url,
      状态: channel.status === 1 ? '启用' : '禁用',
      余额: channel.balance ? Number(channel.balance).toFixed(2) : '0.00',
      已用金额: channel.used_amount ? Number(channel.used_amount).toFixed(2) : '0.00',
      优先级: channel.priority || 0,
      创建时间: formatDate(channel.created_at)
    }))
    
    // 转换为CSV格式
    const header = Object.keys(exportData[0]).join(',')
    const csv = [
      header,
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    // 创建下载链接
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `渠道列表_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  }
}

// 过滤状态
const filterStatus = (value, row) => {
  return row.status === value
}

// 更新渠道余额
const updateChannelBalance = async (channel) => {
  try {
    ElMessage.info(`正在更新渠道 "${channel.name}" 的余额...`)
    await apiUpdateChannelBalance(channel.id)
    ElMessage.success(`渠道 "${channel.name}" 余额更新成功`)
    // 重新加载该渠道的数据
    const index = channels.value.findIndex(item => item.id === channel.id)
    if (index !== -1) {
      const updatedChannel = await getChannelById(channel.id)
      if (updatedChannel && updatedChannel.data) {
        channels.value[index] = updatedChannel.data
      }
    }
  } catch (error) {
    ElMessage.error(`渠道 "${channel.name}" 余额更新失败`)
    console.error(error)
  }
}

// 对话框成功处理
const handleDialogSuccess = () => {
  loadChannels()
}

onMounted(() => {
  // 确保页面加载时立即获取数据
  loadChannels()
  loadChannelTypeNames()
})

// 当页面从缓存中被激活时也重新加载数据
onActivated(() => {
  loadChannels()
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
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.channel-header h1 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.channel-actions {
  display: flex;
  gap: 10px;
}

.channel-search {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.low-balance {
  color: #f56c6c;
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-button-group .el-button {
  padding: 5px 8px;
}

/* 表格中的通用格式 */
:deep(.el-table .cell) {
  white-space: nowrap;
}

:deep(.el-table) {
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

:deep(.el-table .el-tag) {
  margin: 0 auto;
}
</style> 