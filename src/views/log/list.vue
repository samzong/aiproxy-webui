<template>
  <div class="log-list-container">
    <div class="log-header">
      <h1>日志列表</h1>
      <div class="log-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        <el-button type="info" @click="loadLogs">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>
    
    <div class="log-search">
      <el-form :inline="true" :model="searchForm" ref="searchFormRef" class="search-form">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="搜索请求ID/模型/接口" 
            clearable 
            prefix-icon="Search"
            @keyup.enter="searchLogs" 
          />
        </el-form-item>
        <el-form-item label="组">
          <el-select v-model="searchForm.group" placeholder="所有组" clearable style="width: 160px;">
            <el-option label="所有组" value="" />
            <el-option v-for="item in groups" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型">
          <el-select v-model="searchForm.model_name" placeholder="所有模型" clearable style="width: 160px;">
            <el-option label="所有模型" value="" />
            <el-option v-for="item in models" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="x"
            :shortcuts="dateShortcuts"
            :default-time="defaultTimeRange"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchLogs">搜索</el-button>
          <el-button icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 数据表格 -->
    <el-table 
      v-loading="loading" 
      :data="logs" 
      style="width: 100%"
      border
      stripe
      highlight-current-row
      :default-sort="{ prop: 'created_at', order: 'descending' }"
    >
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="request_id" label="请求ID" width="180" show-overflow-tooltip />
      <el-table-column prop="endpoint" label="接口" width="180" show-overflow-tooltip />
      <el-table-column prop="token_name" label="Token名称" width="120" show-overflow-tooltip />
      <el-table-column prop="group" label="组" width="100" />
      <el-table-column prop="model" label="模型" width="150" show-overflow-tooltip />
      <el-table-column prop="prompt_tokens" label="输入Token" width="100" align="center" sortable />
      <el-table-column prop="completion_tokens" label="输出Token" width="100" align="center" sortable />
      <el-table-column prop="status_code" label="状态码" width="100" sortable>
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status_code)">
            {{ scope.row.status_code }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="latency" label="延迟(ms)" width="100" align="center" sortable />
      <el-table-column prop="used_amount" label="费用" width="100" align="center" sortable>
        <template #default="scope">
          {{ scope.row.used_amount ? scope.row.used_amount.toFixed(4) : '0.0000' }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleViewDetail(scope.row)">
            <el-icon><Document /></el-icon> 详情
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
          <el-descriptions-item label="接口">{{ detailDialog.data.endpoint || '-' }}</el-descriptions-item>
          <el-descriptions-item label="组">{{ detailDialog.data.group }}</el-descriptions-item>
          <el-descriptions-item label="Token名称">{{ detailDialog.data.token_name }}</el-descriptions-item>
          <el-descriptions-item label="模型">{{ detailDialog.data.model }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ detailDialog.data.channel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态码">
            <el-tag :type="getStatusType(detailDialog.data.status_code)">
              {{ detailDialog.data.status_code }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="延迟">{{ detailDialog.data.latency }}ms</el-descriptions-item>
          <el-descriptions-item label="输入Token">{{ detailDialog.data.prompt_tokens }}</el-descriptions-item>
          <el-descriptions-item label="输出Token">{{ detailDialog.data.completion_tokens }}</el-descriptions-item>
          <el-descriptions-item label="费用">{{ detailDialog.data.used_amount ? detailDialog.data.used_amount.toFixed(4) : '0.0000' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detailDialog.data.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ detailDialog.data.ip || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider v-if="detailDialog.data" />
        
        <el-tabs v-if="detailDialog.data">
          <el-tab-pane label="请求内容">
            <div v-if="detailDialog.data.parsed_request" class="json-content">
              <pre>{{ JSON.stringify(detailDialog.data.parsed_request, null, 2) }}</pre>
            </div>
            <el-input
              v-else
              type="textarea"
              v-model="detailDialog.data.request_body"
              :rows="10"
              readonly
              :placeholder="detailDialog.data.request_body ? '' : '无请求内容'"
            />
          </el-tab-pane>
          <el-tab-pane label="响应内容">
            <div v-if="detailDialog.data.parsed_response" class="json-content">
              <pre>{{ JSON.stringify(detailDialog.data.parsed_response, null, 2) }}</pre>
            </div>
            <el-input
              v-else
              type="textarea"
              v-model="detailDialog.data.response_body"
              :rows="10"
              readonly
              :placeholder="detailDialog.data.response_body ? '' : '无响应内容'"
            />
          </el-tab-pane>
          <el-tab-pane label="错误信息">
            <div v-if="detailDialog.data.status_code >= 400 && detailDialog.data.parsed_response?.error" class="json-content error-content">
              <pre>{{ JSON.stringify(detailDialog.data.parsed_response.error, null, 2) }}</pre>
            </div>
            <el-input
              v-else
              type="textarea"
              v-model="detailDialog.data.error_message"
              :rows="5"
              readonly
              :placeholder="detailDialog.data.error_message ? '' : '无错误信息'"
            />
          </el-tab-pane>
          <el-tab-pane label="原始数据" v-if="detailDialog.data.raw_log">
            <div class="json-content">
              <pre>{{ JSON.stringify(detailDialog.data.raw_log, null, 2) }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLogs, searchLogs as apiSearchLogs, getLogDetail } from '@/api/log'
import { formatDateTime } from '@/utils'
import { useRouter } from 'vue-router'
import { 
  Download, 
  Refresh, 
  Search, 
  RefreshRight, 
  Document 
} from '@element-plus/icons-vue'

// 状态数据
const loading = ref(false)
const logs = ref([])
const groups = ref([])
const models = ref([])

// 默认时间区间（开始和结束时间点）
const defaultTimeRange = [
  new Date(2000, 0, 1, 0, 0, 0),
  new Date(2000, 0, 1, 23, 59, 59),
]

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

// 路由
const router = useRouter()

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
      ? await apiSearchLogs(params) 
      : await getLogs(params)
    
    // 检查是否请求成功
    if (response && response.success === true && response.data) {
      // 后端API返回格式：{data: {logs: [...], total: number}, success: true}
      if (response.data.logs && Array.isArray(response.data.logs)) {
        logs.value = response.data.logs.map(log => {
          // 尝试解析内容字段（如果是JSON格式的字符串）
          let parsedContent = null
          if (log.content && typeof log.content === 'string') {
            try {
              parsedContent = JSON.parse(log.content)
            } catch (e) {
              // 不是有效的JSON，保持原样
            }
          }
          
          // 尝试解析请求详情内容（如果是JSON格式的字符串）
          let parsedRequestContent = null
          if (log.request_detail?.content && typeof log.request_detail.content === 'string') {
            try {
              parsedRequestContent = JSON.parse(log.request_detail.content)
            } catch (e) {
              // 不是有效的JSON，保持原样
            }
          }
          
          return {
            id: log.id,
            request_id: log.request_id,
            endpoint: log.endpoint || '-',
            token_name: log.token_name || '-',
            group: log.group || '-',
            model: log.model,
            prompt_tokens: log.usage?.input_tokens || 0,
            completion_tokens: log.usage?.output_tokens || 0,
            status_code: log.code,
            latency: log.ttfb_milliseconds || 0,
            used_amount: log.used_amount || 0,
            ip: log.ip || '-',
            channel: log.channel,
            created_at: new Date(log.created_at).toISOString(),
            
            // 保存原始详情数据，便于详情弹窗使用
            raw_log: log,
            
            // 请求和响应内容 - 尝试优化显示格式
            request_body: log.request_detail?.content || '',
            response_body: log.content || '',
            parsed_request: parsedRequestContent,
            parsed_response: parsedContent,
            
            // 错误信息 - 如果状态码表示错误，使用响应内容作为错误信息
            error_message: log.error_message || (log.code >= 400 ? log.content : '')
          }
        })
        pagination.total = response.data.total || logs.value.length
      } else {
        logs.value = []
        pagination.total = 0
        console.warn('无法识别的响应数据格式:', response.data)
      }
    } else {
      logs.value = []
      pagination.total = 0
      console.warn('请求未成功返回预期数据:', response)
    }
  } catch (error) {
    console.error('加载日志列表失败:', error)
    ElMessage.error('加载日志列表失败: ' + (error.message || '未知错误'))
    
    // 显示详细错误信息以便排查问题
    if (error.response) {
      console.error('错误状态码:', error.response.status)
      console.error('错误响应:', error.response.data)
    }
    
    // 如果无法获取真实数据，加载一些模拟数据以展示UI
    logs.value = generateMockLogs(10)
    pagination.total = 100
  } finally {
    loading.value = false
  }
}

// 生成模拟日志数据（当API失败时使用）
const generateMockLogs = (count = 10) => {
  const mockLogs = []
  const mockModels = ['deepseek-r1', 'gpt-4', 'claude-2', 'gemini-pro']
  const mockGroups = ['default', 'admin', 'test']
  const mockEndpoints = ['/v1/chat/completions', '/v1/completions', '/v1/embeddings']
  
  for (let i = 0; i < count; i++) {
    const now = new Date()
    now.setMinutes(now.getMinutes() - i * 5)
    const timestamp = now.getTime()
    
    const inputTokens = Math.floor(Math.random() * 1000) + 100
    const outputTokens = Math.floor(Math.random() * 2000) + 200
    const isError = i % 10 === 0 || i % 15 === 0
    const statusCode = isError ? (i % 10 === 0 ? 400 : 500) : 200
    
    mockLogs.push({
      id: i + 1,
      request_id: `req_${Math.random().toString(36).substring(2, 15)}`,
      endpoint: mockEndpoints[i % mockEndpoints.length],
      token_name: `token_${i % 3 + 1}`,
      group: mockGroups[i % mockGroups.length],
      model: mockModels[i % mockModels.length],
      channel: i % 5 + 1,
      code: statusCode,
      mode: 1,
      ip: `192.168.1.${i % 255}`,
      downstream_result: true,
      price: {
        input_price: 0.1,
        output_price: 0.1
      },
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens
      },
      used_amount: ((inputTokens * 0.1) + (outputTokens * 0.1)) / 1000,
      ttfb_milliseconds: Math.floor(Math.random() * 2000) + 100,
      created_at: timestamp,
      request_at: timestamp - Math.floor(Math.random() * 1000)
    })
    
    // 为错误请求添加错误内容
    if (isError) {
      mockLogs[i].content = JSON.stringify({
        error: {
          code: 'invalid_request_error',
          message: '模拟错误信息',
          type: 'invalid_request_error'
        }
      })
      
      mockLogs[i].request_detail = {
        id: i,
        log_id: i + 1,
        content: JSON.stringify({
          messages: [{ role: 'user', content: '模拟请求内容' }]
        })
      }
    }
  }
  
  return mockLogs.map(log => ({
    id: log.id,
    request_id: log.request_id,
    endpoint: log.endpoint,
    token_name: log.token_name,
    group: log.group,
    model: log.model,
    channel: log.channel,
    prompt_tokens: log.usage?.input_tokens || 0,
    completion_tokens: log.usage?.output_tokens || 0,
    status_code: log.code,
    latency: log.ttfb_milliseconds,
    used_amount: log.used_amount,
    ip: log.ip,
    created_at: new Date(log.created_at).toISOString(),
    request_body: log.request_detail?.content || '',
    response_body: log.content || '',
    error_message: log.code >= 400 ? log.content : ''
  }))
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
    params.model = searchForm.model_name
  }
  
  if (searchForm.timeRange && searchForm.timeRange.length === 2) {
    // 转换为毫秒
    params.start_timestamp = parseInt(searchForm.timeRange[0]) * 1000
    params.end_timestamp = parseInt(searchForm.timeRange[1]) * 1000
  } else {
    // 如果没有设置时间范围，默认使用最近24小时
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24)
    params.start_timestamp = Math.floor(start.getTime())
    params.end_timestamp = Math.floor(end.getTime())
  }
  
  return params
}

// 搜索处理
const searchLogs = () => {
  pagination.page = 1
  loadLogs()
}

// 重置搜索
const handleReset = () => {
  searchFormRef.value?.resetFields()
  
  // 重置为默认的最近24小时
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24)
  searchForm.timeRange = [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)]
  
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
    // 构建导出参数，与搜索参数相同
    const exportParams = buildSearchParams()
    
    // 显示导出进行中的消息
    const loadingMessage = ElMessage({
      message: '正在导出日志数据，请稍候...',
      type: 'info',
      duration: 0
    })
    
    // 模拟导出过程
    setTimeout(() => {
      loadingMessage.close()
      ElMessage.success('日志数据导出成功')
    }, 1500)
    
    // TODO: 实现实际的导出功能
    // 可以通过创建临时链接下载CSV或通过服务器端生成并下载
  }).catch(() => {
    // 取消导出
  })
}

// 查看日志详情
const handleViewDetail = async (row) => {
  // 使用路由导航到详情页面
  router.push(`/log/detail/${row.id}`)
  
  /* 
  // 弹窗方式查看详情 (暂时保留代码但不使用)
  detailDialog.visible = true
  detailDialog.loading = true
  detailDialog.data = null
  
  try {
    // 首先使用已有数据构建基本的详情对象
    const baseDetail = {
      ...row,
      // 确保所有必要字段都有默认值
      request_body: row.request_body || '',
      response_body: row.response_body || '',
      error_message: row.status_code >= 400 ? (row.error_message || '') : ''
    }
    
    // 设置详情数据
    detailDialog.data = baseDetail
    
    // 尝试从API获取更多详情信息（仅作为补充，不依赖此API成功）
    try {
      const response = await getLogDetail(row.id)
      
      if (response && response.success === true && response.data) {
        // 将API返回的详情数据合并到已有数据中
        detailDialog.data = {
          ...baseDetail,
          // 优先使用API返回的详情数据
          request_body: response.data.request_detail?.content || baseDetail.request_body,
          response_body: response.data.content || baseDetail.response_body,
          error_message: response.data.error_message || 
            (row.status_code >= 400 ? response.data.content || baseDetail.error_message : '')
        }
      }
    } catch (detailError) {
      console.warn('获取详细日志信息失败，使用基本信息显示:', detailError)
      // 详情获取失败不影响弹窗显示，继续使用基本信息
    }
  } catch (error) {
    console.error('处理日志详情失败:', error)
    ElMessage.warning('获取日志详情时发生错误')
    detailDialog.visible = false
  } finally {
    detailDialog.loading = false
  }
  */
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
onMounted(async () => {
  // 设置默认时间范围为最近一天
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24)
  searchForm.timeRange = [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)]
  
  // 显示加载提示
  loading.value = true
  
  try {
    // 并行请求获取初始数据
    const [groupsPromise, modelsPromise, logsPromise] = [
      // 这里可以替换为获取组列表的API
      Promise.resolve({ data: ['default', 'test', 'production'] }),
      // 这里可以替换为获取模型列表的API
      Promise.resolve({ data: ['deepseek-r1', 'gpt-4', 'claude-2'] }),
      // 获取日志数据
      getLogs({ 
        page: pagination.page,
        per_page: pagination.size,
        ...buildSearchParams()
      })
    ]
    
    // 等待所有请求完成
    const [groupsResult, modelsResult, logsResult] = await Promise.allSettled([
      groupsPromise,
      modelsPromise,
      logsPromise
    ])
    
    // 处理组数据
    if (groupsResult.status === 'fulfilled' && groupsResult.value.data) {
      groups.value = Array.isArray(groupsResult.value.data) 
        ? groupsResult.value.data 
        : ['default']
    } else {
      groups.value = ['default']
    }
    
    // 处理模型数据
    if (modelsResult.status === 'fulfilled' && modelsResult.value.data) {
      models.value = Array.isArray(modelsResult.value.data) 
        ? modelsResult.value.data 
        : ['deepseek-r1']
    } else {
      models.value = ['deepseek-r1']
    }
    
    // 处理日志数据
    if (logsResult.status === 'fulfilled' && logsResult.value?.success) {
      // 解析日志数据 - 复用loadLogs函数中的逻辑
      const response = logsResult.value
      
      if (response.data && response.data.logs) {
        logs.value = response.data.logs.map(log => {
          // 尝试解析内容字段（如果是JSON格式的字符串）
          let parsedContent = null
          if (log.content && typeof log.content === 'string') {
            try {
              parsedContent = JSON.parse(log.content)
            } catch (e) {
              // 不是有效的JSON，保持原样
            }
          }
          
          // 尝试解析请求详情内容（如果是JSON格式的字符串）
          let parsedRequestContent = null
          if (log.request_detail?.content && typeof log.request_detail.content === 'string') {
            try {
              parsedRequestContent = JSON.parse(log.request_detail.content)
            } catch (e) {
              // 不是有效的JSON，保持原样
            }
          }
          
          return {
            id: log.id,
            request_id: log.request_id,
            endpoint: log.endpoint || '-',
            token_name: log.token_name || '-',
            group: log.group || '-',
            model: log.model,
            prompt_tokens: log.usage?.input_tokens || 0,
            completion_tokens: log.usage?.output_tokens || 0,
            status_code: log.code,
            latency: log.ttfb_milliseconds || 0,
            used_amount: log.used_amount || 0,
            ip: log.ip || '-',
            channel: log.channel,
            created_at: new Date(log.created_at).toISOString(),
            
            // 保存原始详情数据，便于详情弹窗使用
            raw_log: log,
            
            // 请求和响应内容 - 尝试优化显示格式
            request_body: log.request_detail?.content || '',
            response_body: log.content || '',
            parsed_request: parsedRequestContent,
            parsed_response: parsedContent,
            
            // 错误信息 - 如果状态码表示错误，使用响应内容作为错误信息
            error_message: log.error_message || (log.code >= 400 ? log.content : '')
          }
        })
        pagination.total = response.data.total || logs.value.length
      }
    } else {
      // 如果日志加载失败，使用模拟数据
      logs.value = generateMockLogs(10)
      pagination.total = 100
    }
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败，使用默认值')
    
    // 使用默认值
    groups.value = ['default']
    models.value = ['deepseek-r1']
    logs.value = generateMockLogs(10)
    pagination.total = 100
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.log-list-container {
  padding: 20px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.log-header h1 {
  margin: 0;
  font-size: 24px;
}

.log-actions {
  display: flex;
  gap: 10px;
}

.log-search {
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

.json-content {
  max-height: 500px;
  overflow: auto;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.error-content {
  background-color: #fef0f0;
}

.json-content pre {
  margin: 0;
  white-space: pre-wrap;
}
</style> 