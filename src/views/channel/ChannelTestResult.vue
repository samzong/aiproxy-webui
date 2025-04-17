<template>
  <el-dialog
    :title="testTitle"
    v-model="visible"
    width="800px"
    :destroy-on-close="true"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="测试结果" name="result">
        <el-table
          v-loading="loading"
          :data="testResults"
          style="width: 100%; margin-top: 15px;"
        >
          <el-table-column prop="model" label="模型名称" min-width="150" />
          <el-table-column prop="actual_model" label="实际模型" min-width="150" />
          <el-table-column label="测试结果" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.success ? 'success' : 'danger'">
                {{ scope.row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latency" label="延迟(秒)" width="100">
            <template #default="scope">
              {{ scope.row.latency ? Number(scope.row.latency).toFixed(2) : '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="状态码" width="80" />
          <el-table-column prop="test_at" label="测试时间" min-width="170">
            <template #default="scope">
              {{ formatDate(scope.row.test_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button 
                type="primary" 
                link 
                @click="showResponseDetail(scope.row)"
                :disabled="!scope.row.response"
              >
                响应详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="响应详情" name="detail" v-if="selectedResult">
        <div class="response-detail">
          <div class="detail-header">
            <div>模型：{{ selectedResult.model }}</div>
            <div>状态：{{ selectedResult.success ? '成功' : '失败' }}</div>
            <div>状态码：{{ selectedResult.code }}</div>
            <div>测试时间：{{ formatDate(selectedResult.test_at) }}</div>
          </div>
          
          <div class="response-content">
            <pre>{{ selectedResult.response }}</pre>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <template #footer>
      <el-button @click="close">关闭</el-button>
      <el-button v-if="channelId" type="primary" @click="refreshTest" :loading="loading">重新测试</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { testChannel } from '@/api/channel'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  channelName: {
    type: String,
    default: ''
  },
  channelId: {
    type: Number,
    default: null
  },
  testResults: {
    type: Array,
    default: () => []
  },
  isAllChannelsTest: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'refresh'])

const loading = ref(false)
const activeTab = ref('result')
const selectedResult = ref(null)

const testTitle = computed(() => {
  if (props.isAllChannelsTest) {
    return '所有渠道测试结果'
  }
  return `渠道测试结果：${props.channelName || 'Unknown'}`
})

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString()
}

// 显示响应详情
const showResponseDetail = (result) => {
  selectedResult.value = result
  activeTab.value = 'detail'
}

// 重新测试
const refreshTest = async () => {
  if (!props.channelId) return
  
  loading.value = true
  try {
    await testChannel(props.channelId)
    ElMessage.success('测试已完成')
    emit('refresh')
  } catch (error) {
    ElMessage.error('测试失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const close = () => {
  emit('update:visible', false)
}

// 当dialog关闭时重置数据
watch(() => props.visible, (val) => {
  if (!val) {
    selectedResult.value = null
    activeTab.value = 'result'
  }
})
</script>

<style scoped>
.response-detail {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 10px;
}

.response-content {
  margin-top: 15px;
  max-height: 400px;
  overflow-y: auto;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.response-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 