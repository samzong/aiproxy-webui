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