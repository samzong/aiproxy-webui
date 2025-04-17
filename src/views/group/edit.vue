<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>编辑组</span>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
        v-loading="loading"
      >
        <el-form-item label="组ID" prop="id">
          <el-input
            v-model="form.id"
            placeholder="组ID"
            disabled
          />
        </el-form-item>
        <el-form-item label="组名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入组名称"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="RPM比例" prop="rpm_ratio">
          <el-input-number
            v-model="form.rpm_ratio"
            :min="0"
            :max="1"
            :precision="2"
            :step="0.01"
            placeholder="请输入RPM比例"
          />
          <span class="form-tip">范围：0-1，保留两位小数</span>
        </el-form-item>
        <el-form-item label="TPM比例" prop="tpm_ratio">
          <el-input-number
            v-model="form.tpm_ratio"
            :min="0"
            :max="1"
            :precision="2"
            :step="0.01"
            placeholder="请输入TPM比例"
          />
          <span class="form-tip">范围：0-1，保留两位小数</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">更新</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getGroup, updateGroup } from '@/api/group'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

// 表单数据
const form = reactive({
  id: '',
  name: '',
  status: 1,
  rpm_ratio: 1,
  tpm_ratio: 1
})

// 表单验证规则
const rules = reactive({
  name: [
    { required: true, message: '请输入组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  rpm_ratio: [
    { required: true, message: '请输入RPM比例', trigger: 'blur' }
  ],
  tpm_ratio: [
    { required: true, message: '请输入TPM比例', trigger: 'blur' }
  ]
})

// 获取组详情
const getGroupDetail = async (id) => {
  loading.value = true
  try {
    const response = await getGroup(id)
    if (response && response.success && response.data) {
      const groupData = response.data
      // 更新表单数据
      Object.keys(form).forEach(key => {
        if (groupData[key] !== undefined) {
          form[key] = groupData[key]
        }
      })
    } else {
      const errorMsg = response?.message || '获取组详情失败，无数据返回'
      ElMessage.error(errorMsg)
      console.error('获取组详情失败:', response)
      // 如果获取详情失败，返回列表页
      setTimeout(() => router.push('/group/list'), 1500)
    }
  } catch (error) {
    console.error('获取组详情失败:', error)
    ElMessage.error('获取组详情失败: ' + (error.message || '请检查网络或API配置'))
    // 如果获取详情失败，返回列表页
    setTimeout(() => router.push('/group/list'), 1500)
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await updateGroup(form.id, form)
        if (response && response.success) {
          ElMessage.success('更新组成功')
          router.push('/group/list')
        } else {
          const errorMsg = response?.message || '更新组失败，请检查API响应'
          ElMessage.error(errorMsg)
          console.error('更新组失败:', response)
        }
      } catch (error) {
        console.error('更新组失败:', error)
        ElMessage.error('更新组失败: ' + (error.message || '请检查网络或API配置'))
      } finally {
        loading.value = false
      }
    } else {
      return false
    }
  })
}

// 取消操作
const cancel = () => {
  router.push('/group/list')
}

// 页面加载时获取组详情
onMounted(() => {
  const id = route.params.id
  if (id) {
    form.id = id
    getGroupDetail(id)
  } else {
    ElMessage.error('组ID不能为空')
    router.push('/group/list')
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style> 