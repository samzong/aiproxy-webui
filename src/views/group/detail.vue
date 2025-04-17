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

      <el-form-item label="可用模型集" prop="available_sets">
        <el-select
          v-model="groupForm.available_sets"
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

const route = useRoute()
const router = useRouter()
const groupFormRef = ref(null)

const groupId = computed(() => route.query.groupId)
const isEdit = computed(() => !!groupId.value)

// 可用的模型集列表（通常需要从API获取）
const availableModelSets = ref(['gpt-3.5', 'gpt-4', 'llama', 'claude', 'gemini'])

// 表单数据
const groupForm = reactive({
  id: '',
  status: 1,
  rpm_ratio: 1.0,
  tpm_ratio: 1.0,
  available_sets: []
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
  ]
})

// 加载组数据（编辑模式）
const loadGroupData = async () => {
  if (!groupId.value) return
  
  try {
    const response = await getGroup(groupId.value)
    if (response.data && response.data.data) {
      const groupData = response.data.data
      
      // 更新表单数据
      groupForm.id = groupData.id
      groupForm.status = groupData.status
      groupForm.rpm_ratio = groupData.rpm_ratio || 1.0
      groupForm.tpm_ratio = groupData.tpm_ratio || 1.0
      groupForm.available_sets = groupData.available_sets || []
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
        status: groupForm.status,
        rpm_ratio: groupForm.rpm_ratio,
        tpm_ratio: groupForm.tpm_ratio,
        available_sets: groupForm.available_sets
      }
      
      if (isEdit.value) {
        // 编辑模式
        response = await updateGroup(groupId.value, submitData)
      } else {
        // 创建模式
        response = await createGroup(groupForm.id, submitData)
      }
      
      if (response.data && response.data.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        goBack()
      } else {
        ElMessage.error(response.data.message || (isEdit.value ? '更新失败' : '创建失败'))
      }
    } catch (error) {
      console.error(isEdit.value ? '更新组失败:' : '创建组失败:', error)
      ElMessage.error(isEdit.value ? '更新组失败' : '创建组失败')
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

onMounted(() => {
  if (isEdit.value) {
    loadGroupData()
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
  max-width: 700px;
}
</style> 