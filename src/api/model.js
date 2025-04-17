import request from '@/utils/request'

// 获取模型配置列表（分页）
export function getModelConfigs(params) {
  return request({
    url: '/api/model_configs',
    method: 'get',
    params
  })
}

// 获取所有模型配置
export function getAllModelConfigs() {
  return request({
    url: '/api/model_configs/all',
    method: 'get'
  })
}

// 搜索模型配置
export function searchModelConfigs(params) {
  return request({
    url: '/api/model_configs/search',
    method: 'get',
    params
  })
}

// 保存单个模型配置
export function saveModelConfig(data) {
  return request({
    url: '/api/model_config',
    method: 'post',
    data
  })
}

// 批量保存模型配置
export function saveModelConfigs(data) {
  return request({
    url: '/api/model_configs',
    method: 'post',
    data
  })
}

// 获取指定模型配置
export function getModelConfig(model) {
  return request({
    url: `/api/model_config/${model}`,
    method: 'get'
  })
}

// 删除指定模型配置
export function deleteModelConfig(model) {
  return request({
    url: `/api/model_config/${model}`,
    method: 'delete'
  })
}

// 批量删除模型配置
export function deleteModelConfigs(models) {
  return request({
    url: '/api/model_configs/batch_delete',
    method: 'post',
    data: models
  })
}

// 根据模型名称列表获取模型配置
export function getModelConfigsByModelsContains(models) {
  return request({
    url: '/api/model_configs/contains',
    method: 'post',
    data: { models }
  })
}

// 获取启用的模型
export function getEnabledModels() {
  return request({
    url: '/api/models/enabled',
    method: 'get'
  })
} 