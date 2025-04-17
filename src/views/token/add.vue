<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑 Token' : '添加 Token' }}</span>
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-form 
        :model="tokenForm" 
        :rules="rules" 
        ref="tokenFormRef" 
        label-width="120px" 
        class="token-form"
        v-loading="loading"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="tokenForm.name" placeholder="请输入 Token 名称" />
        </el-form-item>
        
        <el-form-item label="分组" prop="group_id">
          <el-select v-model="tokenForm.group_id" placeholder="选择分组" style="width: 100%">
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.id"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模型限制">
          <el-select
            v-model="tokenForm.models"
            multiple
            filterable
            allow-create
            placeholder="选择允许访问的模型，不选则不限制"
            style="width: 100%"
          >
            <el-option
              v-for="model in availableModels"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="子网限制">
          <el-select
            v-model="tokenForm.subnets"
            multiple
            filterable
            allow-create
            placeholder="输入允许访问的子网地址，如 192.168.1.0/24，不填则不限制"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>
        
        <el-form-item label="配额">
          <el-input-number 
            v-model="tokenForm.quota" 
            :min="0" 
            :precision="2" 
            :step="10" 
            placeholder="Token 配额，0 表示无限制" 
            style="width: 100%" 
          />
        </el-form-item>
        
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="tokenForm.expiredAt"
            type="datetime"
            placeholder="选择过期时间，不选则永不过期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTokenById, addGroupToken, updateGroupToken } from '@/api/token'
import { getGroups } from '@/api/group'
import { getAllModelConfigs } from '@/api/model'

const route = useRoute()
const router = useRouter()
const tokenId = computed(() => route.params.id || route.query.id)
const isEdit = computed(() => !!tokenId.value)
const loading = ref(false)
const submitLoading = ref(false)
const tokenFormRef = ref(null)
const groups = ref([])
const availableModels = ref([])

// 表单数据
const tokenForm = reactive({
  id: null,
  name: '',
  group_id: '',
  models: [],
  subnets: [],
  quota: 0,
  expiredAt: null,
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入 Token 名称', trigger: 'blur' },
    { max: 30, message: 'Token 名称不能超过 30 个字符', trigger: 'blur' }
  ],
  group_id: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ],
}

// 返回上一页
const goBack = () => {
  router.push('/token/list')
}

// 获取分组列表
const loadGroups = async () => {
  try {
    const res = await getGroups({
      page: 1,
      per_page: 1000 // 加载所有分组
    })
    groups.value = res.data.groups
  } catch (error) {
    ElMessage.error('获取分组列表失败')
    console.error(error)
  }
}

// 获取模型列表
const loadModels = async () => {
  try {
    const res = await getAllModelConfigs()
    availableModels.value = res.data.map(config => config.model)
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error(error)
  }
}

// 获取 Token 详情
const loadToken = async () => {
  if (!tokenId.value) return
  
  loading.value = true
  try {
    const res = await getTokenById(tokenId.value)
    const tokenData = res.data
    
    // 填充表单数据
    tokenForm.id = tokenData.id
    tokenForm.name = tokenData.name || ''
    tokenForm.group_id = tokenData.group_id || ''
    tokenForm.models = tokenData.models || []
    tokenForm.subnets = tokenData.subnets || []
    tokenForm.quota = tokenData.quota || 0
    tokenForm.expiredAt = tokenData.expired_at ? new Date(tokenData.expired_at) : null
  } catch (error) {
    ElMessage.error('获取 Token 详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!tokenFormRef.value) return
  
  await tokenFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      const data = {
        name: tokenForm.name,
        models: tokenForm.models,
        subnets: tokenForm.subnets,
        quota: tokenForm.quota,
        expiredAt: tokenForm.expiredAt ? tokenForm.expiredAt.getTime() : 0
      }
      
      if (isEdit.value) {
        await updateGroupToken(tokenForm.group_id, tokenForm.id, data)
        ElMessage.success('Token 更新成功')
      } else {
        await addGroupToken(tokenForm.group_id, data)
        ElMessage.success('Token 添加成功')
      }
      
      router.push('/token/list')
    } catch (error) {
      ElMessage.error(isEdit.value ? 'Token 更新失败' : 'Token 添加失败')
      console.error(error)
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  loadGroups()
  loadModels()
  if (tokenId.value) {
    loadToken()
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.token-form {
  max-width: 700px;
  margin: 0 auto;
}
</style> 