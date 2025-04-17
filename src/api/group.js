import request from '@/utils/request'

/**
 * 获取组列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getGroups(params) {
  return request({
    url: '/api/group',
    method: 'get',
    params
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
 * @param {Object} data - 组数据
 * @returns {Promise}
 */
export function createGroup(data) {
  return request({
    url: '/api/group',
    method: 'post',
    data
  })
}

/**
 * 更新组
 * @param {number} id - 组ID
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
    url: '/api/groups/search',
    method: 'get',
    params
  })
}

// 批量更新组状态
export function updateGroupsStatus(groups, status) {
  return request({
    url: '/api/groups/batch_status',
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

// 获取组的模型配置列表
export function getGroupModelConfigs(groupId) {
  return request({
    url: `/api/group/${groupId}/model_configs/`,
    method: 'get'
  })
}

// 获取组特定模型配置
export function getGroupModelConfig(groupId, modelName) {
  return request({
    url: `/api/group/${groupId}/model_config/${modelName}`,
    method: 'get'
  })
}

// 保存组模型配置
export function saveGroupModelConfig(groupId, data) {
  return request({
    url: `/api/group/${groupId}/model_config/`,
    method: 'post',
    data
  })
}

// 批量保存组模型配置
export function saveGroupModelConfigs(groupId, data) {
  return request({
    url: `/api/group/${groupId}/model_configs/`,
    method: 'post',
    data
  })
}

// 更新组模型配置
export function updateGroupModelConfig(groupId, modelName, data) {
  return request({
    url: `/api/group/${groupId}/model_config/${modelName}`,
    method: 'put',
    data
  })
}

// 批量更新组模型配置
export function updateGroupModelConfigs(groupId, data) {
  return request({
    url: `/api/group/${groupId}/model_configs/`,
    method: 'put',
    data
  })
}

// 删除组模型配置
export function deleteGroupModelConfig(groupId, modelName) {
  return request({
    url: `/api/group/${groupId}/model_config/${modelName}`,
    method: 'delete'
  })
}

// 批量删除组模型配置
export function deleteGroupModelConfigs(groupId, modelNames) {
  return request({
    url: `/api/group/${groupId}/model_configs/`,
    method: 'delete',
    data: modelNames
  })
} 