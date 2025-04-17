import request from '@/utils/request'

/**
 * 获取所有日志
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getLogs(params) {
  return request({
    url: '/api/logs',
    method: 'get',
    params
  })
}

/**
 * 获取日志详情
 * @param {number|string} logId - 日志ID
 * @returns {Promise}
 */
export function getLogDetail(logId) {
  return request({
    url: `/api/logs/detail/${logId}`,
    method: 'get'
  })
}

/**
 * 搜索日志
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchLogs(params) {
  return request({
    url: '/api/logs/search',
    method: 'get',
    params
  })
}

/**
 * 获取已使用的Token名称
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getUsedTokenNames(params) {
  return request({
    url: '/api/logs/used/token_names',
    method: 'get',
    params
  })
}

/**
 * 获取已使用的模型名称
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getUsedModels(params) {
  return request({
    url: '/api/logs/used/models',
    method: 'get',
    params
  })
}

/**
 * 搜索消费错误
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchConsumeErrors(params) {
  return request({
    url: '/api/logs/consume_error',
    method: 'get',
    params
  })
}

/**
 * 删除历史日志
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {Promise}
 */
export function deleteHistoryLogs(timestamp) {
  return request({
    url: '/api/logs',
    method: 'delete',
    params: { timestamp }
  })
}

/**
 * 获取特定组的日志
 * @param {string} group - 组名称
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getGroupLogs(group, params) {
  return request({
    url: `/api/log/${group}`,
    method: 'get',
    params
  })
}

/**
 * 搜索特定组的日志
 * @param {string} group - 组名称
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchGroupLogs(group, params) {
  return request({
    url: `/api/log/${group}/search`,
    method: 'get',
    params
  })
}

/**
 * 获取特定组的日志详情
 * @param {string} group - 组名称
 * @param {number|string} logId - 日志ID
 * @returns {Promise}
 */
export function getGroupLogDetail(group, logId) {
  return request({
    url: `/api/log/${group}/detail/${logId}`,
    method: 'get'
  })
}

/**
 * 获取特定组已使用的Token名称
 * @param {string} group - 组名称
 * @returns {Promise}
 */
export function getGroupUsedTokenNames(group) {
  return request({
    url: `/api/log/${group}/used/token_names`,
    method: 'get'
  })
}

/**
 * 获取特定组已使用的模型名称
 * @param {string} group - 组名称
 * @returns {Promise}
 */
export function getGroupUsedModels(group) {
  return request({
    url: `/api/log/${group}/used/models`,
    method: 'get'
  })
} 