import request from '@/utils/request'

// 获取仪表盘数据
export function getDashboard(params) {
  return request({
    url: '/api/dashboard',
    method: 'get',
    params
  })
}

// 获取组仪表盘数据
export function getGroupDashboard(group, params) {
  return request({
    url: `/api/dashboard/${group}`,
    method: 'get',
    params
  })
}

// 获取组仪表盘模型数据
export function getGroupDashboardModels(group, params) {
  return request({
    url: `/api/dashboard/${group}/models`,
    method: 'get',
    params
  })
}

// 获取模型成本排名
export function getModelCostRank(params) {
  return request({
    url: '/api/model_cost_rank',
    method: 'get',
    params
  })
}

// 获取组模型成本排名
export function getGroupModelCostRank(group, params) {
  return request({
    url: `/api/model_cost_rank/${group}`,
    method: 'get',
    params
  })
}

// 获取指标趋势数据
export function getDashboardTrends(params) {
  return request({
    url: '/api/dashboard/trends',
    method: 'get',
    params
  })
}

// 获取响应时间分布
export function getResponseTimeDistribution(params) {
  return request({
    url: '/api/dashboard/response_time',
    method: 'get',
    params
  })
}

// 获取组请求分布
export function getGroupRequestDistribution(params) {
  return request({
    url: '/api/dashboard/group_requests',
    method: 'get',
    params
  })
}

// 获取模型使用趋势
export function getModelTrends(params) {
  return request({
    url: '/api/dashboard/model_trends',
    method: 'get',
    params
  })
} 