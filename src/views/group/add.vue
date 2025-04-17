<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑组' : '添加组' }}</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="group-form"
        v-loading="loading"
      >
        <el-form-item label="名称" prop="id">
          <el-input v-model="form.id" placeholder="请输入组名称" :disabled="isEdit" />
        </el-form-item>
        
        <el-form-item label="RPM限制比例" prop="rpm_ratio">
          <el-input-number 
            v-model="form.rpm_ratio" 
            :min="0" 
            :max="100" 
            :precision="1"
            placeholder="请输入RPM限制比例"
          />
          <span class="form-tip">百分比，例如: 80表示限制为模型RPM的80%</span>
        </el-form-item>
        
        <el-form-item label="TPM限制比例" prop="tpm_ratio">
          <el-input-number 
            v-model="form.tpm_ratio" 
            :min="0" 
            :max="100" 
            :precision="1"
            placeholder="请输入TPM限制比例"
          />
          <span class="form-tip">百分比，例如: 80表示限制为模型TPM的80%</span>
        </el-form-item>
        
        <el-form-item label="可用模型集" prop="available_set">
          <el-select 
            v-model="form.available_set" 
            multiple 
            filterable 
            placeholder="请选择可用模型集" 
            style="width: 100%"
          >
            <el-option 
              v-for="model in availableModels" 
              :key="model.value" 
              :label="model.label" 
              :value="model.value"
            />
          </el-select>
          <span class="form-tip">不选择表示不限制模型</span>
        </el-form-item>
        
        <el-form-item label="余额提醒">
          <el-switch v-model="form.balance_alert_enabled" />
        </el-form-item>
        
        <el-form-item label="提醒阈值" v-if="form.balance_alert_enabled" prop="balance_alert_threshold">
          <el-input-number
            v-model="form.balance_alert_threshold"
            :min="0"
            :precision="2"
            placeholder="请输入提醒阈值"
          />
          <span class="form-tip">余额低于此值时发送提醒</span>
        </el-form-item>
        
        <el-form-item label="状态" prop="status" v-if="isEdit">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="2">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
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
const loading = ref(false)
const formRef = ref(null)
const availableModels = ref([])

// 判断是否为编辑模式
const isEdit = computed(() => {
  return !!route.params.id
})

// 表单数据
const form = reactive({
  id: '',
  rpm_ratio: 100,
  tpm_ratio: 100,
  available_set: [],
  balance_alert_enabled: false,
  balance_alert_threshold: 0,
  status: 1
})

// 表单验证规则
const rules = reactive({
  id: [
    { required: true, message: '请输入组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符之间', trigger: 'blur' }
  ],
  rpm_ratio: [
    { required: true, message: '请输入RPM限制比例', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '取值范围为0-100', trigger: 'blur' }
  ],
  tpm_ratio: [
    { required: true, message: '请输入TPM限制比例', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '取值范围为0-100', trigger: 'blur' }
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
      availableModels.value = response.data.map(model => ({
        label: model.model,
        value: model.model
      }))
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
  }
}

// 获取组信息
const loadGroupInfo = async (id) => {
  loading.value = true
  try {
    const response = await getGroup(id)
    if (response && response.data) {
      // 根据后端返回数据格式调整
      const data = response.data
      form.id = data.id
      form.rpm_ratio = data.rpm_ratio || data.rpmRatio || 100
      form.tpm_ratio = data.tpm_ratio || data.tpmRatio || 100
      form.available_set = data.available_sets || data.availableSets || []
      form.balance_alert_enabled = data.balance_alert_enabled || data.balanceAlertEnabled || false
      form.balance_alert_threshold = data.balance_alert_threshold || data.balanceAlertThreshold || 0
      form.status = data.status || 1
    } else {
      ElMessage.error('获取组信息失败: 返回数据格式不正确')
      console.error('返回数据格式不正确:', response)
    }
  } catch (error) {
    console.error('获取组信息失败:', error)
    ElMessage.error(`获取组信息失败: ${error.message || '请检查网络连接或API配置'}`)
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid, fields) => {
    if (!valid) {
      console.log('表单验证失败', fields)
      return
    }
    
    loading.value = true
    try {
      // 准备提交的数据
      const submitData = {
        rpm_ratio: form.rpm_ratio,
        tpm_ratio: form.tpm_ratio,
        available_set: form.available_set,
        balance_alert_enabled: form.balance_alert_enabled,
        balance_alert_threshold: form.balance_alert_threshold
      }
      
      // 如果是编辑模式，还需要带上status字段
      if (isEdit.value) {
        submitData.status = form.status
      }
      
      let response
      if (isEdit.value) {
        response = await updateGroup(route.params.id, submitData)
        ElMessage.success('更新成功')
      } else {
        response = await createGroup(form.id, submitData)
        ElMessage.success('创建成功')
      }
      console.log('操作成功，返回数据:', response)
      goBack()
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error(`保存失败: ${error.message || '请检查API地址是否正确'}`)
      
      // 详细报错信息，帮助排查问题
      if (error.response) {
        console.error('响应状态:', error.response.status)
        console.error('响应数据:', error.response.data)
      }
    } finally {
      loading.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (isEdit.value) {
    loadGroupInfo(route.params.id)
  } else {
    formRef.value?.resetFields()
  }
}

// 返回列表页
const goBack = () => {
  router.push('/group/list')
}

// 页面加载时初始化
onMounted(async () => {
  await fetchAvailableModels()
  
  if (isEdit.value) {
    await loadGroupInfo(route.params.id)
  }
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style> 