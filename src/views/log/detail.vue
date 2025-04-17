<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>日志详情</span>
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
      </template>
      <div v-loading="loading">
        <div v-if="!hasData && !loading" class="no-data">
          <el-empty description="未找到日志数据" />
          <el-button type="primary" @click="goBack" style="margin-top: 20px;">返回列表</el-button>
        </div>
        
        <template v-if="hasData">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日志ID">{{ logDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="请求时间">{{ formatDate(logDetail.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="请求ID" v-if="logDetail.request_id">{{ logDetail.request_id }}</el-descriptions-item>
            <el-descriptions-item label="渠道">{{ logDetail.channel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="模型">{{ logDetail.model || '-' }}</el-descriptions-item>
            <el-descriptions-item label="组">{{ logDetail.group || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Token名称">{{ logDetail.token_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="请求耗时">{{ (logDetail.response_time || logDetail.latency || 0) }} {{ logDetail.response_time ? '秒' : 'ms' }}</el-descriptions-item>
            <el-descriptions-item label="Token数量">
              <span>输入: {{ logDetail.prompt_tokens || logDetail.usage?.input_tokens || 0 }}</span>
              <span style="margin-left: 10px;">输出: {{ logDetail.completion_tokens || logDetail.usage?.output_tokens || 0 }}</span>
              <span style="margin-left: 10px;">总计: {{ logDetail.tokens_total || ((logDetail.prompt_tokens || logDetail.usage?.input_tokens || 0) + (logDetail.completion_tokens || logDetail.usage?.output_tokens || 0)) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <template v-if="logDetail.status">
                <el-tag :type="logDetail.status === 'success' ? 'success' : 'danger'">
                  {{ logDetail.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
              <template v-else-if="logDetail.status_code !== undefined">
                <el-tag :type="getStatusType(logDetail.status_code)">
                  {{ logDetail.status_code }}
                </el-tag>
              </template>
              <template v-else>
                <el-tag type="info">未知状态</el-tag>
              </template>
            </el-descriptions-item>
            <el-descriptions-item label="IP地址">{{ logDetail.ip || '-' }}</el-descriptions-item>
            <el-descriptions-item label="费用" v-if="logDetail.used_amount !== undefined">{{ formatAmount(logDetail.used_amount) }}</el-descriptions-item>
          </el-descriptions>

          <div class="mt-4">
            <el-tabs type="border-card">
              <el-tab-pane label="请求内容">
                <pre class="json-content">{{ formatJson(logDetail.request || logDetail.request_body || logDetail.parsed_request) }}</pre>
              </el-tab-pane>
              <el-tab-pane label="响应内容">
                <pre class="json-content">{{ formatJson(logDetail.response || logDetail.response_body || logDetail.parsed_response) }}</pre>
              </el-tab-pane>
              <el-tab-pane v-if="hasErrorInfo" label="错误信息">
                <pre class="json-content error-content">{{ formatJson(logDetail.error || logDetail.error_message || (logDetail.parsed_response && logDetail.parsed_response.error)) }}</pre>
              </el-tab-pane>
              <el-tab-pane v-if="logDetail.raw_log" label="原始数据">
                <pre class="json-content">{{ formatJson(logDetail.raw_log) }}</pre>
              </el-tab-pane>
            </el-tabs>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLogDetail } from '@/api/log'

const route = useRoute()
const router = useRouter()
const logId = route.params.id
const loading = ref(true)
const logDetail = ref({})

// 计算属性：是否有数据
const hasData = computed(() => {
  return Object.keys(logDetail.value).length > 0
})

// 计算属性：是否有错误信息
const hasErrorInfo = computed(() => {
  return !!(
    logDetail.value.error || 
    logDetail.value.error_message || 
    (logDetail.value.parsed_response && logDetail.value.parsed_response.error) ||
    (logDetail.value.status_code && logDetail.value.status_code >= 400)
  )
})

// 获取日志详情
const fetchLogDetail = async () => {
  try {
    loading.value = true
    const res = await getLogDetail(logId)
    
    if (res && res.data) {
      // 处理API响应数据
      const data = res.data
      
      // 尝试解析内容字段（如果是JSON格式的字符串）
      if (data.content && typeof data.content === 'string') {
        try {
          data.parsed_response = JSON.parse(data.content)
        } catch (e) {
          // 不是有效的JSON，保持原样
        }
      }
      
      // 尝试解析请求详情内容（如果是JSON格式的字符串）
      if (data.request_detail?.content && typeof data.request_detail.content === 'string') {
        try {
          data.parsed_request = JSON.parse(data.request_detail.content)
        } catch (e) {
          // 不是有效的JSON，保持原样
        }
      }
      
      // 根据状态码确定状态
      if (data.code !== undefined && data.status === undefined) {
        data.status = data.code >= 200 && data.code < 300 ? 'success' : 'failed'
      }
      
      // 错误处理 - 如果状态码表示错误，使用响应内容作为错误信息
      if (data.code >= 400 && !data.error) {
        data.error = data.content || ''
      }
      
      logDetail.value = {
        ...data,
        // 添加一些额外的处理字段
        request_body: data.request_detail?.content || '',
        response_body: data.content || '',
        error_message: data.error || (data.code >= 400 ? data.content : '')
      }
    } else {
      ElMessage.warning('获取日志详情失败：无数据')
    }
  } catch (error) {
    ElMessage.error('获取日志详情失败：' + (error.message || '未知错误'))
    console.error('获取日志详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/log/list')
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '暂无数据'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化金额
const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0.00'
  return Number(amount).toFixed(4)
}

// 格式化JSON显示
const formatJson = (json) => {
  if (!json) return '暂无数据'
  try {
    return typeof json === 'string' ? JSON.stringify(JSON.parse(json), null, 2) : JSON.stringify(json, null, 2)
  } catch (e) {
    return typeof json === 'string' ? json : JSON.stringify(json || {})
  }
}

onMounted(() => {
  fetchLogDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-content {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  max-height: 400px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
}

.error-content {
  color: #f56c6c;
}

.mt-4 {
  margin-top: 20px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style> 