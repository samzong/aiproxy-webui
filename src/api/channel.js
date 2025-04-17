import request from '@/utils/request'

/**
 * 获取渠道列表
 * @param {object} params - 分页参数 {page, per_page}
 * @returns {Promise}
 */
export function getChannels(params) {
  return request({
    url: '/api/channels',
    method: 'get',
    params
  })
}

/**
 * 添加渠道
 * @param {object} data - 渠道数据
 * @returns {Promise}
 */
export function addChannel(data) {
  return request({
    url: '/api/channel',
    method: 'post',
    data
  })
}

/**
 * 更新渠道
 * @param {number} id - 渠道ID
 * @param {object} data - 渠道数据
 * @returns {Promise}
 */
export function updateChannel(id, data) {
  return request({
    url: `/api/channel/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除渠道
 * @param {number} id - 渠道ID
 * @returns {Promise}
 */
export function deleteChannel(id) {
  return request({
    url: `/api/channel/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除渠道
 * @param {array} ids - 渠道ID数组
 * @returns {Promise}
 */
export function deleteChannels(ids) {
  return request({
    url: '/api/channels/batch_delete',
    method: 'post',
    data: ids
  })
}

/**
 * 更新渠道状态
 * @param {number} id - 渠道ID
 * @param {object} data - 状态数据 {status}
 * @returns {Promise}
 */
export function updateChannelStatus(id, data) {
  return request({
    url: `/api/channel/${id}/status`,
    method: 'post',
    data
  })
}

/**
 * 获取渠道类型名称列表
 * @returns {Promise}
 */
export function getChannelTypeNames() {
  return request({
    url: '/api/channels/type_names',
    method: 'get'
  })
}

/**
 * 获取渠道类型元数据
 * @returns {Promise}
 */
export function getChannelTypeMetas() {
  return request({
    url: '/api/channels/type_metas',
    method: 'get'
  })
}

/**
 * 根据关键词和类型搜索渠道
 * @param {object} params - 搜索参数 {keyword, channel_type, page, per_page}
 * @returns {Promise}
 */
export function searchChannels(params) {
  return request({
    url: '/api/channels/search',
    method: 'get',
    params
  })
}

/**
 * 测试指定渠道是否可用
 * @param {number} id - 渠道ID
 * @returns {Promise}
 */
export function testChannel(id) {
  return request({
    url: `/api/channel/${id}/test`,
    method: 'get'
  })
}

/**
 * 测试所有启用的渠道
 * @returns {Promise}
 */
export function testAllChannels() {
  return request({
    url: '/api/channels/test',
    method: 'get'
  })
}

/**
 * 更新所有启用渠道的余额
 * @returns {Promise}
 */
export function updateAllChannelsBalance() {
  return request({
    url: '/api/channels/update_balance',
    method: 'get'
  })
}

/**
 * 获取单个渠道详情
 * @param {number} id - 渠道ID
 * @returns {Promise}
 */
export function getChannelById(id) {
  return request({
    url: `/api/channel/${id}`,
    method: 'get'
  })
}

/**
 * 更新单个渠道余额
 * @param {number} id - 渠道ID
 * @returns {Promise}
 */
export function updateChannelBalance(id) {
  return request({
    url: `/api/channel/${id}/balance`,
    method: 'get'
  })
}

// 获取所有渠道
export function getAllChannels() {
  return request({
    url: '/api/channels/all',
    method: 'get'
  })
}

// 添加多个渠道
export function addChannels(data) {
  return request({
    url: '/api/channels',
    method: 'post',
    data
  })
}

/**
 * 获取渠道默认模型和映射
 * @returns {Promise}
 */
export function getChannelDefaultModels() {
  return request({
    url: '/api/models/default',
    method: 'get'
  })
}

/**
 * 获取指定类型渠道的默认模型和映射
 * @param {number} type - 渠道类型
 * @returns {Promise}
 */
export function getChannelDefaultModelsByType(type) {
  return request({
    url: `/api/models/default/${type}`,
    method: 'get'
  })
} 