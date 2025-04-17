import request from '@/utils/request'

/**
 * 获取组列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getGroups(params) {
  // 处理空字符串参数
  const cleanParams = { ...params }
  Object.keys(cleanParams).forEach(key => {
    if (cleanParams[key] === '') {
      delete cleanParams[key]
    }
  })
  
  // 转换参数名称
  if (cleanParams.size) {
    cleanParams.per_page = cleanParams.size
    delete cleanParams.size
  }
  
  return request({
    url: '/api/groups',
    method: 'get',
    params: cleanParams
  })
}

/**
 * 获取组详情
 * @param {number} id - 组ID
 * @returns {Promise}
 */
export function getGroup(id) {
  return request({
    url: `/api/group/${id}`,
    method: 'get'
  })
}

/**
 * 创建组
 * @param {string} groupId - 组ID
 * @param {Object} data - 组数据
 * @returns {Promise}
 */
export function createGroup(groupId, data) {
  return request({
    url: `/api/group/${groupId}`,
    method: 'post',
    data
  })
}

/**
 * 更新组
 * @param {string} id - 组ID
 * @param {Object} data - 组数据
 * @returns {Promise}
 */
export function updateGroup(id, data) {
  return request({
    url: `/api/group/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除组
 * @param {number} id - 组ID
 * @returns {Promise}
 */
export function deleteGroup(id) {
  return request({
    url: `/api/group/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除组
 * @param {Array} ids - 组ID数组
 * @returns {Promise}
 */
export function deleteGroups(ids) {
  return request({
    url: '/api/group/batch',
    method: 'delete',
    data: { ids }
  })
}

/**
 * 更新组状态
 * @param {number} id - 组ID
 * @param {number} status - 状态值：1启用，0禁用
 * @returns {Promise}
 */
export function updateGroupStatus(id, status) {
  return request({
    url: `/api/group/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 获取组的模型配置
 * @param {String} id - 组ID
 * @returns {Promise} - 请求Promise
 */
export function getGroupModels(id) {
  return request({
    url: `/api/group/${id}/models`,
    method: 'get'
  })
}

/**
 * 更新组的模型配置
 * @param {String} id - 组ID
 * @param {Object} data - 模型配置数据
 * @returns {Promise} - 请求Promise
 */
export function updateGroupModels(id, data) {
  return request({
    url: `/api/group/${id}/models`,
    method: 'put',
    data
  })
}

// 搜索组
export function searchGroups(params) {
  return request({
    url: '/api/group/search',
    method: 'get',
    params
  })
}

// 批量更新组状态
export function updateGroupsStatus(groups, status) {
  return request({
    url: '/api/group/batch_status',
    method: 'post',
    data: { groups, status }
  })
}

// 更新组RPM比率
export function updateGroupRPMRatio(groupId, rpmRatio) {
  return request({
    url: `/api/group/${groupId}/rpm_ratio`,
    method: 'post',
    data: { rpm_ratio: rpmRatio }
  })
}

/**
 * 获取组模型配置列表
 * @param {string} group - 组名
 * @returns {Promise}
 */
export function getGroupModelConfigs(group) {
  return request({
    url: `/api/group/${group}/model_configs/`,
    method: 'get'
  })
}

/**
 * 获取特定组模型配置
 * @param {string} group - 组名
 * @param {string} model - 模型名
 * @returns {Promise}
 */
export function getGroupModelConfig(group, model) {
  return request({
    url: `/api/group/${group}/model_config/${model}`,
    method: 'get'
  })
}

/**
 * 保存组模型配置
 * @param {string} group - 组名
 * @param {object} data - 模型配置
 * @returns {Promise}
 */
export function saveGroupModelConfig(group, data) {
  return request({
    url: `/api/group/${group}/model_config/`,
    method: 'post',
    data
  })
}

/**
 * 更新组模型配置
 * @param {string} group - 组名
 * @param {string} model - 模型名
 * @param {object} data - 模型配置
 * @returns {Promise}
 */
export function updateGroupModelConfig(group, model, data) {
  return request({
    url: `/api/group/${group}/model_config/${model}`,
    method: 'put',
    data
  })
}

/**
 * 批量保存组模型配置
 * @param {string} group - 组名
 * @param {array} data - 模型配置数组
 * @returns {Promise}
 */
export function saveGroupModelConfigs(group, data) {
  return request({
    url: `/api/group/${group}/model_configs/`,
    method: 'post',
    data
  })
}

/**
 * 批量更新组模型配置
 * @param {string} group - 组名
 * @param {array} data - 模型配置数组
 * @returns {Promise}
 */
export function updateGroupModelConfigs(group, data) {
  return request({
    url: `/api/group/${group}/model_configs/`,
    method: 'put',
    data
  })
}

/**
 * 删除组模型配置
 * @param {string} group - 组名
 * @param {string} model - 模型名
 * @returns {Promise}
 */
export function deleteGroupModelConfig(group, model) {
  return request({
    url: `/api/group/${group}/model_config/${model}`,
    method: 'delete'
  })
}

/**
 * 批量删除组模型配置
 * @param {string} group - 组名
 * @param {array} models - 模型名数组
 * @returns {Promise}
 */
export function deleteGroupModelConfigs(group, models) {
  return request({
    url: `/api/group/${group}/model_configs/`,
    method: 'delete',
    data: models
  })
}

/**
 * 更新组 TPM 比率
 * @param {string} group - 组名
 * @param {object} data - TPM 比率数据 { tpm_ratio: number }
 * @returns {Promise}
 */
export function updateGroupTPMRatio(group, data) {
  return request({
    url: `/api/group/${group}/tpm_ratio`,
    method: 'post',
    data
  })
}

/**
 * 更新组余额警报配置
 * @param {string} group - 组名
 * @param {object} data - 余额警报配置 { balance_alert_enabled: boolean, balance_alert_threshold: number }
 * @returns {Promise}
 */
export function updateGroupBalanceAlert(group, data) {
  return request({
    url: `/api/group/${group}/balance_alert`,
    method: 'post',
    data
  })
} 