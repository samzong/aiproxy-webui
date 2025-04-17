<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>日志列表</span>
          <div class="right-buttons">
            <el-button type="primary" @click="handleExport">导出</el-button>
            <el-button type="info" @click="loadLogs">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索表单 -->
      <el-form :model="searchForm" ref="searchFormRef" inline class="search-form">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="searchForm.keyword" placeholder="请输入关键词" clearable />
        </el-form-item>
        <el-form-item label="组" prop="group">
          <el-select v-model="searchForm.group" placeholder="选择组" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="item in groups" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型" prop="model_name">
          <el-select v-model="searchForm.model_name" placeholder="选择模型" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="item in models" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围" prop="timeRange">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="x"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 数据表格 -->
      <el-table 
        v-loading="loading" 
        :data="logs" 
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="request_id" label="请求ID" width="220" show-overflow-tooltip />
        <el-table-column prop="token_name" label="Token名称" width="150" show-overflow-tooltip />
        <el-table-column prop="group" label="组" width="100" />
        <el-table-column prop="model" label="模型" width="150" show-overflow-tooltip />
        <el-table-column prop="prompt_tokens" label="输入Token" width="100" align="center" />
        <el-table-column prop="completion_tokens" label="输出Token" width="100" align="center" />
        <el-table-column prop="status_code" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status_code)">
              {{ scope.row.status_code }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="latency" label="延迟(ms)" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleViewDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 日志详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="日志详情"
      width="80%"
      :destroy-on-close="true"
    >
      <div v-loading="detailDialog.loading">
        <el-descriptions border :column="2" v-if="detailDialog.data">
          <el-descriptions-item label="ID">{{ detailDialog.data.id }}</el-descriptions-item>
          <el-descriptions-item label="请求ID">{{ detailDialog.data.request_id }}</el-descriptions-item>
          <el-descriptions-item label="组">{{ detailDialog.data.group }}</el-descriptions-item>
          <el-descriptions-item label="Token名称">{{ detailDialog.data.token_name }}</el-descriptions-item>
          <el-descriptions-item label="模型">{{ detailDialog.data.model }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ detailDialog.data.channel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态码">{{ detailDialog.data.status_code }}</el-descriptions-item>
          <el-descriptions-item label="延迟">{{ detailDialog.data.latency }}ms</el-descriptions-item>
          <el-descriptions-item label="输入Token">{{ detailDialog.data.prompt_tokens }}</el-descriptions-item>
          <el-descriptions-item label="输出Token">{{ detailDialog.data.completion_tokens }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detailDialog.data.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ detailDialog.data.ip || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider v-if="detailDialog.data" />
        
        <el-tabs v-if="detailDialog.data">
          <el-tab-pane label="请求内容">
            <el-input
              type="textarea"
              v-model="detailDialog.data.request_body"
              :rows="10"
              readonly
              :placeholder="detailDialog.data.request_body ? '' : '无请求内容'"
            />
          </el-tab-pane>
          <el-tab-pane label="响应内容">
            <el-input
              type="textarea"
              v-model="detailDialog.data.response_body"
              :rows="10"
              readonly
              :placeholder="detailDialog.data.response_body ? '' : '无响应内容'"
            />
          </el-tab-pane>
          <el-tab-pane label="错误信息">
            <el-input
              type="textarea"
              v-model="detailDialog.data.error_message"
              :rows="5"
              readonly
              :placeholder="detailDialog.data.error_message ? '' : '无错误信息'"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLogs, searchLogs, getLogDetail } from '@/api/log'
import { formatDateTime } from '@/utils'

// 状态数据
const loading = ref(false)
const logs = ref([])
const groups = ref([])
const models = ref([])

// 搜索表单
const searchFormRef = ref(null)
const searchForm = reactive({
  keyword: '',
  group: '',
  model_name: '',
  timeRange: null
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date(new Date().toDateString())
      return [start, end]
    }
  },
  {
    text: '最近一天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: '最近三天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 3)
      return [start, end]
    }
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  }
]

// 日志详情对话框
const detailDialog = reactive({
  visible: false,
  loading: false,
  data: null
})

// 加载日志列表
const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.size,
      ...buildSearchParams()
    }
    
    const response = searchForm.keyword 
      ? await searchLogs(params) 
      : await getLogs(params)
    
    logs.value = response.data.list || []
    pagination.total = response.data.total || 0
  } catch (error) {
    console.error('加载日志列表失败:', error)
    ElMessage.error('加载日志列表失败')
  } finally {
    loading.value = false
  }
}

// 构建搜索参数
const buildSearchParams = () => {
  const params = {}
  
  if (searchForm.keyword) {
    params.keyword = searchForm.keyword
  }
  
  if (searchForm.group) {
    params.group = searchForm.group
  }
  
  if (searchForm.model_name) {
    params.model_name = searchForm.model_name
  }
  
  if (searchForm.timeRange && searchForm.timeRange.length === 2) {
    params.start_timestamp = searchForm.timeRange[0]
    params.end_timestamp = searchForm.timeRange[1]
  }
  
  return params
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  loadLogs()
}

// 重置搜索
const handleReset = () => {
  searchFormRef.value?.resetFields()
  pagination.page = 1
  loadLogs()
}

// 导出日志
const handleExport = () => {
  ElMessageBox.confirm('确认导出当前筛选条件下的日志数据？', '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    ElMessage.success('导出功能开发中')
    // TODO: 实现导出功能
  }).catch(() => {
    // 取消导出
  })
}

// 查看日志详情
const handleViewDetail = async (row) => {
  detailDialog.visible = true
  detailDialog.loading = true
  detailDialog.data = null
  
  try {
    const response = await getLogDetail(row.id)
    detailDialog.data = response.data
  } catch (error) {
    console.error('获取日志详情失败:', error)
    ElMessage.error('获取日志详情失败')
  } finally {
    detailDialog.loading = false
  }
}

// 状态码样式
const getStatusType = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) {
    return 'success'
  } else if (statusCode >= 400 && statusCode < 500) {
    return 'warning'
  } else if (statusCode >= 500) {
    return 'danger'
  }
  return 'info'
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  loadLogs()
}

// 当前页变化
const handleCurrentChange = (page) => {
  pagination.page = page
  loadLogs()
}

// 格式化日期
const formatDate = (dateStr) => {
  return formatDateTime(dateStr)
}

// 页面加载时获取数据
onMounted(() => {
  // 设置默认时间范围为最近一天
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24)
  searchForm.timeRange = [start.getTime(), end.getTime()]
  
  // 模拟数据，实际应该从API获取
  groups.value = ['default', 'admin', 'test']
  models.value = ['gpt-3.5-turbo', 'gpt-4', 'claude-2', 'gemini-pro']
  
  loadLogs()
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.right-buttons {
  display: flex;
  gap: 10px;
}
</style> 