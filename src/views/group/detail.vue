<template>
  <div class="group-detail-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑组' : '添加组' }}</h2>
      <el-button @click="goBack">返回</el-button>
    </div>

    <el-form
      ref="groupFormRef"
      :model="groupForm"
      :rules="rules"
      label-width="120px"
      class="group-form"
    >
      <el-form-item label="组ID" prop="id">
        <el-input v-model="groupForm.id" :disabled="isEdit" placeholder="请输入组ID" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select v-model="groupForm.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="2" />
          <el-option label="内部" :value="3" />
        </el-select>
      </el-form-item>

      <el-form-item label="RPM比率" prop="rpm_ratio">
        <el-input-number 
          v-model="groupForm.rpm_ratio" 
          :min="0"
          :precision="2"
          :step="0.1"
          placeholder="请输入RPM比率"
        />
      </el-form-item>

      <el-form-item label="TPM比率" prop="tpm_ratio">
        <el-input-number 
          v-model="groupForm.tpm_ratio" 
          :min="0"
          :precision="2"
          :step="0.1"
          placeholder="请输入TPM比率"
        />
      </el-form-item>

      <el-form-item label="可用模型集" prop="available_set">
        <el-select
          v-model="groupForm.available_set"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择可用模型集（空表示所有模型可用）"
        >
          <el-option 
            v-for="item in availableModelSets" 
            :key="item" 
            :label="item" 
            :value="item"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="余额提醒">
        <el-switch v-model="groupForm.balance_alert_enabled" />
      </el-form-item>
      
      <el-form-item label="提醒阈值" v-if="groupForm.balance_alert_enabled" prop="balance_alert_threshold">
        <el-input-number
          v-model="groupForm.balance_alert_threshold"
          :min="0"
          :precision="2"
          placeholder="请输入提醒阈值"
        />
        <span class="form-tip">余额低于此值时发送提醒</span>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getGroup, createGroup, updateGroup } from '@/api/group'
import { getModelConfigs } from '@/api/model'

const route = useRoute()
const router = useRouter()
const groupFormRef = ref(null)

const groupId = computed(() => route.query.groupId)
const isEdit = computed(() => !!groupId.value)

// 可用的模型集列表
const availableModelSets = ref([])

// 表单数据
const groupForm = reactive({
  id: '',
  status: 1,
  rpm_ratio: 1.0,
  tpm_ratio: 1.0,
  available_set: [],
  balance_alert_enabled: false,
  balance_alert_threshold: 0
})

// 表单验证规则
const rules = reactive({
  id: [
    { required: true, message: '请输入组ID', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在3到50个字符之间', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  rpm_ratio: [
    { required: true, message: '请输入RPM比率', trigger: 'blur' }
  ],
  tpm_ratio: [
    { required: true, message: '请输入TPM比率', trigger: 'blur' }
  ],
  balance_alert_threshold: [
    { type: 'number', min: 0, message: '阈值必须大于等于0', trigger: 'blur' }
  ]
})

// 获取可用模型列表
const fetchAvailableModels = async () => {
  try {
    const response = await getModelConfigs()
    if (response && response.data) {
      availableModelSets.value = response.data.map(model => model.model)
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
  }
}

// 加载组数据（编辑模式）
const loadGroupData = async () => {
  if (!groupId.value) return
  
  try {
    const response = await getGroup(groupId.value)
    if (response && response.data) {
      const groupData = response.data
      
      // 更新表单数据，处理字段名称差异
      groupForm.id = groupData.id
      groupForm.status = groupData.status
      groupForm.rpm_ratio = groupData.rpm_ratio !== undefined ? groupData.rpm_ratio : (groupData.rpmRatio || 1.0)
      groupForm.tpm_ratio = groupData.tpm_ratio !== undefined ? groupData.tpm_ratio : (groupData.tpmRatio || 1.0)
      groupForm.available_set = groupData.available_sets || groupData.availableSets || []
      groupForm.balance_alert_enabled = groupData.balance_alert_enabled !== undefined ? 
        groupData.balance_alert_enabled : (groupData.balanceAlertEnabled || false)
      groupForm.balance_alert_threshold = groupData.balance_alert_threshold !== undefined ? 
        groupData.balance_alert_threshold : (groupData.balanceAlertThreshold || 0)
    } else {
      ElMessage.error('加载组数据失败: 返回数据格式不正确')
    }
  } catch (error) {
    console.error('加载组数据失败:', error)
    ElMessage.error('加载组数据失败')
  }
}

// 提交表单
const submitForm = () => {
  groupFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      let response
      const submitData = {
        rpm_ratio: groupForm.rpm_ratio,
        tpm_ratio: groupForm.tpm_ratio,
        available_set: groupForm.available_set,
        balance_alert_enabled: groupForm.balance_alert_enabled,
        balance_alert_threshold: groupForm.balance_alert_threshold
      }
      
      // 编辑模式下需要包含状态字段
      if (isEdit.value) {
        submitData.status = groupForm.status
      }
      
      if (isEdit.value) {
        // 编辑模式
        response = await updateGroup(groupId.value, submitData)
      } else {
        // 创建模式
        response = await createGroup(groupForm.id, submitData)
      }
      
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      goBack()
    } catch (error) {
      console.error(isEdit.value ? '更新组失败:' : '创建组失败:', error)
      ElMessage.error(error.message || (isEdit.value ? '更新组失败' : '创建组失败'))
      
      // 打印详细错误信息以便调试
      if (error.response) {
        console.error('响应状态:', error.response.status)
        console.error('响应数据:', error.response.data)
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (isEdit.value) {
    // 编辑模式下重置为原始数据
    loadGroupData()
  } else {
    // 创建模式下重置为默认值
    groupFormRef.value.resetFields()
  }
}

// 返回上一页
const goBack = () => {
  router.push('/group/list')
}

onMounted(async () => {
  await fetchAvailableModels()
  if (isEdit.value) {
    await loadGroupData()
  }
})
</script>

<style scoped>
.group-detail-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.group-form {
  max-width: 800px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style> 