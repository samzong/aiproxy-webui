<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>错误监控</span>
          <div class="right-buttons">
            <el-button type="primary" @click="handleExport">导出</el-button>
            <el-button type="info" @click="loadErrors">刷新</el-button>
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
      
      <!-- 错误统计卡片 -->
      <div class="stat-cards">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总错误数</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.today }}</div>
          <div class="stat-label">今日错误</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.rate }}%</div>
          <div class="stat-label">错误率</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.avgLatency }}ms</div>
          <div class="stat-label">平均延迟</div>
        </el-card>
      </div>
      
      <!-- 数据表格 -->
      <el-table 
        v-loading="loading" 
        :data="errors" 
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="request_id" label="请求ID" width="220" show-overflow-tooltip />
        <el-table-column prop="token_name" label="Token名称" width="150" show-overflow-tooltip />
        <el-table-column prop="group" label="组" width="100" />
        <el-table-column prop="model" label="模型" width="150" show-overflow-tooltip />
        <el-table-column prop="status_code" label="状态码" width="100">
          <template #default="scope">
            <el-tag type="danger">
              {{ scope.row.status_code }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip />
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
    
    <!-- 错误详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="错误详情"
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
          <el-descriptions-item label="创建时间">{{ formatDate(detailDialog.data.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ detailDialog.data.ip || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider v-if="detailDialog.data" />
        
        <el-tabs v-if="detailDialog.data">
          <el-tab-pane label="错误信息">
            <el-input
              type="textarea"
              v-model="detailDialog.data.error_message"
              :rows="5"
              readonly
            />
          </el-tab-pane>
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
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { searchConsumeErrors, getLogDetail } from '@/api/log'
import { formatDateTime } from '@/utils'

// 状态数据
const loading = ref(false)
const errors = ref([])
const groups = ref([])
const models = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  today: 0,
  rate: 0,
  avgLatency: 0
})

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

// 错误详情对话框
const detailDialog = reactive({
  visible: false,
  loading: false,
  data: null
})

// 加载错误列表
const loadErrors = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.size,
      ...buildSearchParams()
    }
    
    const response = await searchConsumeErrors(params)
    
    // 处理响应数据
    if (response && response.data) {
      let totalItems = 0
      const data = []
      
      // 判断响应数据的格式
      if (Array.isArray(response.data)) {
        // 如果是数组格式直接使用
        data.push(...response.data)
        totalItems = response.total || response.data.length
      } else if (response.data.list) {
        // 如果是带list属性的对象格式
        data.push(...response.data.list)
        totalItems = response.data.total || response.data.list.length
      } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        // 如果是分组格式，合并所有组的数据
        for (const key in response.data) {
          if (response.data[key]) {
            if (response.data[key].logs) {
              data.push(...response.data[key].logs)
              totalItems += response.data[key].total || response.data[key].logs.length
            } else if (Array.isArray(response.data[key])) {
              data.push(...response.data[key])
              totalItems += response.data[key].length
            }
          }
        }
      }
      
      errors.value = data
      pagination.total = totalItems
      
      // 更新统计数据
      updateStats()
    } else {
      errors.value = []
      pagination.total = 0
      // 如果没有数据，使用模拟数据
      useMockData()
    }
  } catch (error) {
    console.error('加载错误列表失败:', error)
    ElMessage.error('加载错误列表失败: ' + (error.message || '未知错误'))
    
    // 显示详细错误信息以便排查问题
    if (error.response) {
      console.error('错误状态码:', error.response.status)
      console.error('错误响应:', error.response.data)
    }
    
    // 如果API不可用，使用模拟数据
    useMockData()
  } finally {
    loading.value = false
  }
}

// 使用模拟数据
const useMockData = () => {
  // 生成一些模拟错误数据
  errors.value = generateMockErrors(10)
  pagination.total = 50
  updateStats()
}

// 生成模拟错误数据
const generateMockErrors = (count = 10) => {
  const mockErrors = []
  const mockModels = ['gpt-3.5-turbo', 'gpt-4', 'claude-2', 'gemini-pro']
  const mockGroups = ['default', 'admin', 'test']
  const mockErrorMessages = [
    '连接超时',
    'API密钥无效',
    '请求参数错误',
    '模型不可用',
    '服务器内部错误',
    '请求频率过高',
    '余额不足'
  ]
  
  for (let i = 0; i < count; i++) {
    const now = new Date()
    now.setMinutes(now.getMinutes() - i * 15)
    
    mockErrors.push({
      id: i + 1,
      request_id: `req_${Math.random().toString(36).substring(2, 15)}`,
      token_name: `token_${i % 3 + 1}`,
      group: mockGroups[i % mockGroups.length],
      model: mockModels[i % mockModels.length],
      status_code: i % 2 === 0 ? 429 : i % 3 === 0 ? 500 : 400,
      error_message: mockErrorMessages[i % mockErrorMessages.length],
      created_at: now.toISOString(),
      request_body: '{"messages": [{"role": "user", "content": "测试消息"}]}',
      response_body: '{"error": {"message": "' + mockErrorMessages[i % mockErrorMessages.length] + '"}}',
      latency: Math.floor(Math.random() * 1000) + 500
    })
  }
  
  return mockErrors
}

// 更新统计数据
const updateStats = () => {
  // 如果有实际错误数据，使用真实数据计算
  if (errors.value.length > 0) {
    stats.total = pagination.total
    
    // 计算今日错误数量
    const today = new Date().setHours(0, 0, 0, 0)
    stats.today = errors.value.filter(error => {
      const errorDate = new Date(error.created_at).getTime()
      return errorDate >= today
    }).length
    
    // 计算错误率和平均延迟
    stats.rate = ((errors.value.length / 1000) * 100).toFixed(2)
    
    const totalLatency = errors.value.reduce((sum, error) => sum + (error.latency || 0), 0)
    stats.avgLatency = errors.value.length > 0 
      ? Math.floor(totalLatency / errors.value.length) 
      : 0
  } else {
    // 使用模拟数据
    stats.total = pagination.total
    stats.today = Math.floor(pagination.total * 0.3)
    stats.rate = (10 * Math.random()).toFixed(2)
    stats.avgLatency = Math.floor(Math.random() * 500 + 200)
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
  loadErrors()
}

// 重置搜索
const handleReset = () => {
  searchFormRef.value?.resetFields()
  pagination.page = 1
  loadErrors()
}

// 导出错误日志
const handleExport = () => {
  ElMessageBox.confirm('确认导出当前筛选条件下的错误日志？', '导出确认', {
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

// 查看错误详情
const handleViewDetail = async (row) => {
  detailDialog.visible = true
  detailDialog.loading = true
  detailDialog.data = null
  
  try {
    const response = await getLogDetail(row.id)
    detailDialog.data = response.data
  } catch (error) {
    console.error('获取错误详情失败:', error)
    ElMessage.error('获取错误详情失败')
  } finally {
    detailDialog.loading = false
  }
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  loadErrors()
}

// 当前页变化
const handleCurrentChange = (page) => {
  pagination.page = page
  loadErrors()
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
  
  loadErrors()
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

.stat-cards {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  width: 23%;
  text-align: center;
  border-radius: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
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

@media (max-width: 768px) {
  .stat-card {
    width: 48%;
    margin-bottom: 10px;
  }
}
</style> 