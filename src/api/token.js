import request from '@/utils/request'

/**
 * 获取 Token 列表
 * @param {object} params - 分页参数 {page, per_page, group, order, status}
 * @returns {Promise}
 */
export function getTokens(params) {
  return request({
    url: '/api/tokens',
    method: 'get',
    params
  })
}

/**
 * 获取单个 Token 详情
 * @param {number} id - Token ID
 * @returns {Promise}
 */
export function getTokenById(id) {
  return request({
    url: `/api/tokens/${id}`,
    method: 'get'
  })
}

/**
 * 获取特定分组的 Token 列表
 * @param {string} group - 分组名称
 * @param {object} params - 分页参数 {page, per_page, order, status}
 * @returns {Promise}
 */
export function getGroupTokens(group, params) {
  return request({
    url: `/api/tokens/${group}`,
    method: 'get',
    params
  })
}

/**
 * 添加分组 Token
 * @param {string} group - 分组名称
 * @param {object} data - Token 数据
 * @param {object} params - 其他参数 {auto_create_group, ignore_exist}
 * @returns {Promise}
 */
export function addGroupToken(group, data, params = {}) {
  return request({
    url: `/api/token/${group}`,
    method: 'post',
    data,
    params
  })
}

/**
 * 更新 Token
 * @param {number} id - Token ID
 * @param {object} data - Token 数据
 * @returns {Promise}
 */
export function updateToken(id, data) {
  return request({
    url: `/api/tokens/${id}`,
    method: 'put',
    data
  })
}

/**
 * 更新分组 Token
 * @param {string} group - 分组名称
 * @param {number} id - Token ID
 * @param {object} data - Token 数据
 * @returns {Promise}
 */
export function updateGroupToken(group, id, data) {
  return request({
    url: `/api/token/${group}/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除 Token
 * @param {number} id - Token ID
 * @returns {Promise}
 */
export function deleteToken(id) {
  return request({
    url: `/api/tokens/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除 Token
 * @param {array} ids - Token ID 数组
 * @returns {Promise}
 */
export function deleteTokens(ids) {
  return request({
    url: '/api/tokens/batch_delete',
    method: 'post',
    data: ids
  })
}

/**
 * 删除分组 Token
 * @param {string} group - 分组名称
 * @param {number} id - Token ID
 * @returns {Promise}
 */
export function deleteGroupToken(group, id) {
  return request({
    url: `/api/token/${group}/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除分组 Token
 * @param {string} group - 分组名称
 * @param {array} ids - Token ID 数组
 * @returns {Promise}
 */
export function deleteGroupTokens(group, ids) {
  return request({
    url: `/api/token/${group}/batch_delete`,
    method: 'post',
    data: ids
  })
}

/**
 * 更新 Token 状态
 * @param {number} id - Token ID
 * @param {object} data - 状态数据 {status}
 * @returns {Promise}
 */
export function updateTokenStatus(id, data) {
  return request({
    url: `/api/tokens/${id}/status`,
    method: 'post',
    data
  })
}

/**
 * 更新分组 Token 状态
 * @param {string} group - 分组名称
 * @param {number} id - Token ID
 * @param {object} data - 状态数据 {status}
 * @returns {Promise}
 */
export function updateGroupTokenStatus(group, id, data) {
  return request({
    url: `/api/token/${group}/${id}/status`,
    method: 'post',
    data
  })
}

/**
 * 搜索 Token
 * @param {object} params - 搜索参数 {keyword, page, per_page, order, name, key, status, group}
 * @returns {Promise}
 */
export function searchTokens(params) {
  return request({
    url: '/api/tokens/search',
    method: 'get',
    params
  })
}

/**
 * 搜索分组 Token
 * @param {string} group - 分组名称
 * @param {object} params - 搜索参数 {keyword, page, per_page, order, name, key, status}
 * @returns {Promise}
 */
export function searchGroupTokens(group, params) {
  return request({
    url: `/api/token/${group}/search`,
    method: 'get',
    params
  })
} 