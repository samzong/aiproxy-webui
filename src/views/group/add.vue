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
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入组名称" />
        </el-form-item>
        
        <el-form-item label="RPM限制比例" prop="rpm_limit_ratio">
          <el-input-number 
            v-model="form.rpm_limit_ratio" 
            :min="0" 
            :max="100" 
            :precision="0"
            placeholder="请输入RPM限制比例"
          />
          <span class="form-tip">百分比，例如: 80表示限制为模型RPM的80%</span>
        </el-form-item>
        
        <el-form-item label="TPM限制比例" prop="tpm_limit_ratio">
          <el-input-number 
            v-model="form.tpm_limit_ratio" 
            :min="0" 
            :max="100" 
            :precision="0"
            placeholder="请输入TPM限制比例"
          />
          <span class="form-tip">百分比，例如: 80表示限制为模型TPM的80%</span>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
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

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const formRef = ref(null)

// 判断是否为编辑模式
const isEdit = computed(() => {
  return !!route.params.id
})

// 表单数据
const form = reactive({
  name: '',
  rpm_limit_ratio: 100,
  tpm_limit_ratio: 100,
  status: 1
})

// 表单验证规则
const rules = reactive({
  name: [
    { required: true, message: '请输入组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符之间', trigger: 'blur' }
  ],
  rpm_limit_ratio: [
    { required: true, message: '请输入RPM限制比例', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '取值范围为0-100', trigger: 'blur' }
  ],
  tpm_limit_ratio: [
    { required: true, message: '请输入TPM限制比例', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '取值范围为0-100', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

// 获取组信息
const loadGroupInfo = async (id) => {
  loading.value = true
  try {
    const response = await getGroup(id)
    Object.assign(form, response.data)
  } catch (error) {
    console.error('获取组信息失败:', error)
    ElMessage.error('获取组信息失败')
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
      if (isEdit.value) {
        await updateGroup(route.params.id, form)
        ElMessage.success('更新成功')
      } else {
        await createGroup(form)
        ElMessage.success('创建成功')
      }
      goBack()
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
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
onMounted(() => {
  if (isEdit.value) {
    loadGroupInfo(route.params.id)
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