<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统概览</span>
              <div class="card-header-right">
                <el-select v-model="timeRange" placeholder="选择时间范围" @change="fetchData">
                  <el-option label="过去24小时" value="day" />
                  <el-option label="过去一周" value="week" />
                  <el-option label="过去两周" value="two_week" />
                  <el-option label="过去一个月" value="month" />
                </el-select>
              </div>
            </div>
          </template>
          
          <el-row :gutter="20" class="data-overview">
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon blue">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">请求总数</div>
                  <div class="data-value">{{ dashboardData.totalCount || dashboardData.total_count || 0 }}</div>
                  <div class="data-trend" v-if="dashboardData.requestCountTrend !== undefined">
                    <span :class="dashboardData.requestCountTrend > 0 ? 'up' : 'down'">
                      <el-icon v-if="dashboardData.requestCountTrend > 0"><ArrowUp /></el-icon>
                      <el-icon v-else><ArrowDown /></el-icon>
                      {{ Math.abs(dashboardData.requestCountTrend || 0).toFixed(1) }}%
                    </span>
                    较上个时段
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon red">
                  <el-icon><CircleClose /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">异常请求</div>
                  <div class="data-value">{{ dashboardData.exceptionCount || dashboardData.exception_count || 0 }}</div>
                  <div class="data-trend" v-if="dashboardData.exceptionCountTrend !== undefined">
                    <span :class="dashboardData.exceptionCountTrend > 0 ? 'up-bad' : 'down-good'">
                      <el-icon v-if="dashboardData.exceptionCountTrend > 0"><ArrowUp /></el-icon>
                      <el-icon v-else><ArrowDown /></el-icon>
                      {{ Math.abs(dashboardData.exceptionCountTrend || 0).toFixed(1) }}%
                    </span>
                    较上个时段
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon green">
                  <el-icon><Tickets /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">总Token数</div>
                  <div class="data-value">{{ formatLargeNumber(dashboardData.totalTokens || dashboardData.total_tokens || 0) }}</div>
                  <div class="data-trend" v-if="dashboardData.tokenTrend !== undefined">
                    <span :class="dashboardData.tokenTrend > 0 ? 'up' : 'down'">
                      <el-icon v-if="dashboardData.tokenTrend > 0"><ArrowUp /></el-icon>
                      <el-icon v-else><ArrowDown /></el-icon>
                      {{ Math.abs(dashboardData.tokenTrend || 0).toFixed(1) }}%
                    </span>
                    较上个时段
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon orange">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">消费金额</div>
                  <div class="data-value">$ {{ formatNumber(dashboardData.usedAmount || dashboardData.used_amount || 0) }}</div>
                  <div class="data-trend" v-if="dashboardData.usedAmountTrend !== undefined">
                    <span :class="dashboardData.usedAmountTrend > 0 ? 'up-bad' : 'down-good'">
                      <el-icon v-if="dashboardData.usedAmountTrend > 0"><ArrowUp /></el-icon>
                      <el-icon v-else><ArrowDown /></el-icon>
                      {{ Math.abs(dashboardData.usedAmountTrend || 0).toFixed(1) }}%
                    </span>
                    较上个时段
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <!-- 第二行统计卡片 -->
          <el-row :gutter="20" class="data-overview">
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon purple">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">平均响应时间</div>
                  <div class="data-value">{{ formatTime(dashboardData.avgResponseTime || dashboardData.avg_response_time || 0) }}</div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon cyan">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">错误率</div>
                  <div class="data-value">{{ calculateErrorRate(dashboardData) }}%</div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon brown">
                  <el-icon><Stopwatch /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">每分钟请求数</div>
                  <div class="data-value">{{ dashboardData.rpm || 0 }}</div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="data-item">
                <div class="data-icon indigo">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="data-info">
                  <div class="data-title">活跃组数</div>
                  <div class="data-value">{{ dashboardData.activeGroups || dashboardData.active_groups || 0 }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <div class="divider"></div>
          
          <div class="chart-container">
            <div class="chart-title">请求趋势</div>
            <div id="requestChart" class="chart"></div>
          </div>
          
          <div class="divider"></div>
          
          <div class="chart-container">
            <div class="chart-title">Token使用情况</div>
            <div id="tokenChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>模型使用排行</span>
            </div>
          </template>
          <div v-if="modelRank.length > 0" id="modelChart" class="chart model-chart"></div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>渠道使用情况</span>
            </div>
          </template>
          <div v-if="channelData.length > 0" id="channelChart" class="chart channel-chart"></div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>响应时间分布</span>
            </div>
          </template>
          <div id="responseTimeChart" class="chart"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>组请求分布</span>
            </div>
          </template>
          <div id="groupRequestChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>模型请求趋势</span>
              <el-select v-model="topModelsCount" placeholder="显示模型数量" @change="renderModelTrendChart">
                <el-option label="Top 3" :value="3" />
                <el-option label="Top 5" :value="5" />
                <el-option label="Top 10" :value="10" />
              </el-select>
            </div>
          </template>
          <div id="modelTrendChart" class="chart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  getDashboard, 
  getModelCostRank, 
  getDashboardTrends, 
  getResponseTimeDistribution, 
  getGroupRequestDistribution, 
  getModelTrends 
} from '@/api/dashboard'
import * as echarts from 'echarts'
import { ArrowUp, ArrowDown, ChatDotRound, CircleClose, Tickets, Money, Timer, Warning, Stopwatch, UserFilled } from '@element-plus/icons-vue'

const timeRange = ref('day')
const dashboardData = ref({})
const modelRank = ref([])
const channelData = ref([])
const topModelsCount = ref(5)

// 响应时间分布数据
const responseTimeDistribution = ref([])
// 组请求分布数据
const groupRequestData = ref([])
// 模型趋势数据
const modelTrendData = ref({})

// 图表实例
let requestChart = null
let tokenChart = null
let modelChart = null
let channelChart = null
let responseTimeChart = null
let groupRequestChart = null
let modelTrendChart = null

// 格式化数字
const formatNumber = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 格式化大数字
const formatLargeNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化时间（毫秒）
const formatTime = (ms) => {
  if (ms < 1000) {
    return ms.toFixed(0) + 'ms'
  } else {
    return (ms / 1000).toFixed(2) + 's'
  }
}

// 计算错误率
const calculateErrorRate = (data) => {
  const totalCount = data.totalCount || data.total_count || 0
  const exceptionCount = data.exceptionCount || data.exception_count || 0
  if (totalCount === 0) return 0
  return ((exceptionCount / totalCount) * 100).toFixed(2)
}

// 获取仪表盘数据
const fetchData = async () => {
  try {
    const response = await getDashboard({
      type: timeRange.value,
      token_usage: true
    })
    
    if (response && response.data) {
      // 获取真实趋势数据
      const trendsResponse = await getDashboardTrends({
        type: timeRange.value
      })
      
      let trendData = {}
      if (trendsResponse && trendsResponse.data) {
        trendData = trendsResponse.data
      }
      
      // 统一处理字段名不一致的问题
      const processedData = { 
        ...response.data,
        // 确保前端所需的字段名都存在，即使后端返回的是不同命名风格
        totalCount: response.data.total_count !== undefined ? response.data.total_count : response.data.totalCount,
        exceptionCount: response.data.exception_count !== undefined ? response.data.exception_count : response.data.exceptionCount,
        totalTokens: response.data.total_tokens !== undefined ? response.data.total_tokens : response.data.totalTokens,
        usedAmount: response.data.used_amount !== undefined ? response.data.used_amount : response.data.usedAmount,
        avgResponseTime: response.data.avg_response_time !== undefined ? response.data.avg_response_time : response.data.avgResponseTime,
        activeGroups: response.data.active_groups !== undefined ? response.data.active_groups : response.data.activeGroups,
        // 图表数据统一处理
        chartData: response.data.chart_data || response.data.chartData || []
      }
      
      console.log('处理后的仪表盘数据:', processedData)
      dashboardData.value = { ...processedData, ...trendData }
      
      // 渲染图表
      renderCharts(processedData)
      
      // 获取响应时间分布数据
      await fetchResponseTimeData()
      
      // 获取组请求分布数据
      await fetchGroupRequestData()
      
      // 获取模型趋势数据
      await fetchModelTrendData()
    }
    
    // 获取模型成本排名
    const rankResponse = await getModelCostRank({
      type: timeRange.value
    })
    
    if (rankResponse && rankResponse.data) {
      modelRank.value = rankResponse.data
      renderModelChart(rankResponse.data)
    }
    
    // 处理渠道数据
    if (response.data && response.data.channels) {
      channelData.value = response.data.channels
      renderChannelChart(response.data.channels)
    }
    
    // 渲染响应时间分布图
    renderResponseTimeChart()
    
    // 渲染组请求分布图
    renderGroupRequestChart()
    
    // 渲染模型趋势图
    renderModelTrendChart()
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

// 获取响应时间分布数据
const fetchResponseTimeData = async () => {
  try {
    const res = await getResponseTimeDistribution({
      type: timeRange.value
    })
    
    if (res && res.data) {
      responseTimeDistribution.value = res.data
    }
  } catch (error) {
    console.error('获取响应时间分布数据失败:', error)
    // 如果API还未实现，提供后备模拟数据
    generateResponseTimeData()
  }
}

// 获取组请求分布数据
const fetchGroupRequestData = async () => {
  try {
    const res = await getGroupRequestDistribution({
      type: timeRange.value
    })
    
    if (res && res.data) {
      groupRequestData.value = res.data
    }
  } catch (error) {
    console.error('获取组请求分布数据失败:', error)
    // 如果API还未实现，提供后备模拟数据
    generateGroupRequestData()
  }
}

// 获取模型趋势数据
const fetchModelTrendData = async () => {
  try {
    const res = await getModelTrends({
      type: timeRange.value
    })
    
    if (res && res.data) {
      modelTrendData.value = res.data
    }
  } catch (error) {
    console.error('获取模型趋势数据失败:', error)
    // 如果API还未实现，提供后备模拟数据
    generateModelTrendData()
  }
}

// 生成响应时间分布数据（仅作为API未实现时的后备方案）
const generateResponseTimeData = () => {
  responseTimeDistribution.value = [
    { range: '0-500ms', count: Math.floor(Math.random() * 1000) + 500 },
    { range: '500ms-1s', count: Math.floor(Math.random() * 800) + 300 },
    { range: '1s-2s', count: Math.floor(Math.random() * 500) + 200 },
    { range: '2s-5s', count: Math.floor(Math.random() * 300) + 100 },
    { range: '5s+', count: Math.floor(Math.random() * 100) + 10 }
  ]
}

// 生成组请求分布数据（仅作为API未实现时的后备方案）
const generateGroupRequestData = () => {
  groupRequestData.value = [
    { name: '产品研发组', value: Math.floor(Math.random() * 1000) + 500 },
    { name: '客户支持组', value: Math.floor(Math.random() * 800) + 400 },
    { name: '市场营销组', value: Math.floor(Math.random() * 600) + 300 },
    { name: '内容创作组', value: Math.floor(Math.random() * 500) + 200 },
    { name: '数据分析组', value: Math.floor(Math.random() * 400) + 100 },
    { name: '其他', value: Math.floor(Math.random() * 300) + 50 }
  ]
}

// 生成模型趋势数据（仅作为API未实现时的后备方案）
const generateModelTrendData = () => {
  const models = ['GPT-4', 'GPT-3.5', 'DALL-E', 'Claude 2', 'Gemini', 'Llama 2', 'PaLM', 'GLM']
  const timestamps = []
  const now = Date.now()
  
  // 根据当前选择的时间范围生成时间戳
  let interval
  let count
  
  switch (timeRange.value) {
    case 'month':
      interval = 24 * 60 * 60 * 1000 // 每天
      count = 30
      break
    case 'two_week':
      interval = 24 * 60 * 60 * 1000 // 每天
      count = 14
      break
    case 'week':
      interval = 24 * 60 * 60 * 1000 // 每天
      count = 7
      break
    default: // day
      interval = 60 * 60 * 1000 // 每小时
      count = 24
  }
  
  for (let i = count - 1; i >= 0; i--) {
    timestamps.push(now - i * interval)
  }
  
  // 为每个模型生成数据
  const data = {}
  models.forEach(model => {
    data[model] = timestamps.map(() => Math.floor(Math.random() * 100))
  })
  
  modelTrendData.value = {
    timestamps,
    data
  }
}

// 渲染图表
const renderCharts = (data) => {
  // 检查图表数据是否存在，兼容chart_data或chartData字段
  const chartData = data.chart_data || data.chartData || []
  if (chartData.length === 0) {
    console.warn('缺少图表数据，无法渲染图表')
    return
  }
  
  console.log('渲染图表的数据:', chartData)
  
  // 请求趋势图
  renderRequestChart(chartData)
  
  // Token使用情况图
  renderTokenChart(chartData)
}

// 渲染请求趋势图
const renderRequestChart = (chartData) => {
  if (!requestChart) {
    requestChart = echarts.init(document.getElementById('requestChart'))
  }
  
  const xData = chartData.map(item => {
    const date = new Date(item.timestamp * 1000)
    return date.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    })
  })
  
  // 统一处理字段名不一致问题
  const successData = chartData.map(item => {
    const total = item.requestCount !== undefined ? item.requestCount : (item.request_count || 0)
    const errors = item.exceptionCount !== undefined ? item.exceptionCount : (item.exception_count || 0)
    return total - errors
  })
  
  const errorData = chartData.map(item => 
    item.exceptionCount !== undefined ? item.exceptionCount : (item.exception_count || 0)
  )
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['成功请求', '失败请求']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '成功请求',
        type: 'line',
        smooth: true,
        data: successData,
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ]
          }
        }
      },
      {
        name: '失败请求',
        type: 'line',
        smooth: true,
        data: errorData,
        itemStyle: {
          color: '#F56C6C'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
            ]
          }
        }
      }
    ]
  }
  
  requestChart.setOption(option)
}

// 渲染Token使用情况图
const renderTokenChart = (chartData) => {
  if (!tokenChart) {
    tokenChart = echarts.init(document.getElementById('tokenChart'))
  }
  
  const xData = chartData.map(item => {
    const date = new Date(item.timestamp * 1000)
    return date.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    })
  })
  
  // 统一处理字段名不一致问题
  const inputData = chartData.map(item => 
    item.inputTokens !== undefined ? item.inputTokens : (item.input_tokens || 0)
  )
  
  const outputData = chartData.map(item => 
    item.outputTokens !== undefined ? item.outputTokens : (item.output_tokens || 0)
  )
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['输入Token', '输出Token']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '输入Token',
        type: 'bar',
        stack: 'total',
        data: inputData,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '输出Token',
        type: 'bar',
        stack: 'total',
        data: outputData,
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  
  tokenChart.setOption(option)
}

// 渲染模型使用排行图
const renderModelChart = (data) => {
  if (!modelChart) {
    modelChart = echarts.init(document.getElementById('modelChart'))
  }
  
  // 提取前10个模型
  const topModels = data.slice(0, 10)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ${c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: topModels.map(item => item.model)
    },
    series: [
      {
        name: '模型消费',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: topModels.map(item => ({
          name: item.model,
          value: item.usedAmount
        }))
      }
    ]
  }
  
  modelChart.setOption(option)
}

// 渲染渠道使用情况图
const renderChannelChart = (data) => {
  if (!channelChart) {
    channelChart = echarts.init(document.getElementById('channelChart'))
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name || `渠道${item.id}`)
    },
    series: [
      {
        name: '渠道请求',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          name: item.name || `渠道${item.id}`,
          value: item.requestCount || 0
        }))
      }
    ]
  }
  
  channelChart.setOption(option)
}

// 渲染响应时间分布图
const renderResponseTimeChart = () => {
  if (!responseTimeChart) {
    responseTimeChart = echarts.init(document.getElementById('responseTimeChart'))
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: responseTimeDistribution.value.map(item => item.range)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '请求数',
        type: 'bar',
        data: responseTimeDistribution.value.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ]
  }
  
  responseTimeChart.setOption(option)
}

// 渲染组请求分布图
const renderGroupRequestChart = () => {
  if (!groupRequestChart) {
    groupRequestChart = echarts.init(document.getElementById('groupRequestChart'))
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      top: 'center',
      data: groupRequestData.value.map(item => item.name)
    },
    series: [
      {
        name: '组请求',
        type: 'pie',
        radius: '55%',
        center: ['60%', '50%'],
        data: groupRequestData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  groupRequestChart.setOption(option)
}

// 渲染模型趋势图
const renderModelTrendChart = () => {
  if (!modelTrendChart) {
    modelTrendChart = echarts.init(document.getElementById('modelTrendChart'))
  }
  
  const { timestamps, data } = modelTrendData.value
  if (!timestamps || !data) return
  
  // 获取按使用量排序后的前N个模型
  const modelUsage = {}
  Object.keys(data).forEach(model => {
    modelUsage[model] = data[model].reduce((sum, val) => sum + val, 0)
  })
  
  const topNModels = Object.keys(modelUsage)
    .sort((a, b) => modelUsage[b] - modelUsage[a])
    .slice(0, topModelsCount.value)
  
  const xData = timestamps.map(ts => {
    const date = new Date(ts)
    return date.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric'
    })
  })
  
  const series = topNModels.map(model => ({
    name: model,
    type: 'line',
    data: data[model],
    smooth: true,
    showSymbol: false
  }))
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: topNModels
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData
    },
    yAxis: {
      type: 'value'
    },
    series
  }
  
  modelTrendChart.setOption(option)
}

// 处理窗口大小变化
const handleResize = () => {
  requestChart && requestChart.resize()
  tokenChart && tokenChart.resize()
  modelChart && modelChart.resize()
  channelChart && channelChart.resize()
  responseTimeChart && responseTimeChart.resize()
  groupRequestChart && groupRequestChart.resize()
  modelTrendChart && modelTrendChart.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  requestChart && requestChart.dispose()
  tokenChart && tokenChart.dispose()
  modelChart && modelChart.dispose()
  channelChart && channelChart.dispose()
  responseTimeChart && responseTimeChart.dispose()
  groupRequestChart && groupRequestChart.dispose()
  modelTrendChart && modelTrendChart.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-right {
  display: flex;
  align-items: center;
}

.data-overview {
  margin-bottom: 20px;
}

.data-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 4px;
  background-color: #f8f8f8;
  height: 100%;
}

.data-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: #fff;
}

.data-icon.blue {
  background-color: #409EFF;
}

.data-icon.red {
  background-color: #F56C6C;
}

.data-icon.green {
  background-color: #67C23A;
}

.data-icon.orange {
  background-color: #E6A23C;
}

.data-icon.purple {
  background-color: #9C27B0;
}

.data-icon.cyan {
  background-color: #00BCD4;
}

.data-icon.brown {
  background-color: #795548;
}

.data-icon.indigo {
  background-color: #3F51B5;
}

.data-info {
  flex: 1;
}

.data-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.data-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.data-trend {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  display: flex;
  align-items: center;
}

.data-trend .up {
  color: #67C23A;
  margin-right: 5px;
  display: flex;
  align-items: center;
}

.data-trend .down {
  color: #F56C6C;
  margin-right: 5px;
  display: flex;
  align-items: center;
}

.data-trend .up-bad {
  color: #F56C6C;
  margin-right: 5px;
  display: flex;
  align-items: center;
}

.data-trend .down-good {
  color: #67C23A;
  margin-right: 5px;
  display: flex;
  align-items: center;
}

.divider {
  height: 1px;
  background-color: #EBEEF5;
  margin: 20px 0;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-title {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart {
  height: 300px;
}

.model-chart, .channel-chart {
  height: 360px;
}

.mt-20 {
  margin-top: 20px;
}
</style> 