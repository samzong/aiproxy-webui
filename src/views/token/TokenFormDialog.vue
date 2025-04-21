<template>
  <el-dialog
    :title="isEdit ? '编辑 Token' : '添加 Token'"
    :modelValue="visible"
    @update:modelValue="$emit('update:visible', $event)"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="Token 名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入 Token 名称" />
      </el-form-item>
      
      <el-form-item label="分组" prop="group_id">
        <el-select v-model="form.group_id" placeholder="请选择分组" style="width: 100%">
          <el-option
            v-for="group in groups"
            :key="group.id"
            :label="group.id"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="form.status"
          :active-value="1"
          :inactive-value="2"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
      
      <el-form-item label="配额" prop="quota">
        <el-input-number 
          v-model="form.quota" 
          :min="0" 
          :precision="2" 
          :step="10" 
          placeholder="Token 配额，0 表示无限制" 
          style="width: 100%" 
        />
      </el-form-item>
      
      <el-form-item label="过期时间">
        <el-date-picker
          v-model="form.expiredAt"
          type="datetime"
          placeholder="选择过期时间，不选则永不过期"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="模型限制">
        <el-select
          v-model="form.models"
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
          v-model="form.subnets"
          multiple
          filterable
          allow-create
          placeholder="输入允许访问的子网地址，如 192.168.1.0/24，不填则不限制"
          style="width: 100%"
        >
        </el-select>
      </el-form-item>
      
      <el-divider content-position="left" v-if="isEdit">Token 信息</el-divider>
      
      <el-form-item label="Token 密钥" v-if="isEdit">
        <el-input 
          v-model="form.key" 
          disabled 
          readonly
          placeholder="Token 密钥"
        >
          <template #append>
            <el-button @click="copyTokenKey">复制</el-button>
          </template>
        </el-input>
      </el-form-item>
      
      <el-form-item label="创建时间" v-if="isEdit">
        <el-input 
          v-model="formattedCreatedAt" 
          disabled 
          readonly 
        />
      </el-form-item>
      
      <el-form-item label="最后访问" v-if="isEdit">
        <el-input 
          v-model="formattedAccessedAt" 
          disabled 
          readonly 
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getTokenById, 
  addGroupToken, 
  updateGroupToken 
} from '@/api/token'
import { getGroups } from '@/api/group'
import { getAllModelConfigs } from '@/api/model'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  token: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const loading = ref(false)
const groups = ref([])
const availableModels = ref([])

const form = reactive({
  id: null,
  name: '',
  group_id: '',
  key: '',
  status: 1,
  quota: 0,
  expiredAt: null,
  models: [],
  subnets: [],
  created_at: null,
  accessed_at: null
})

const rules = reactive({
  name: [
    { required: true, message: '请输入 Token 名称', trigger: 'blur' },
    { max: 30, message: 'Token 名称不能超过 30 个字符', trigger: 'blur' }
  ],
  group_id: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ]
})

const formattedCreatedAt = computed(() => {
  if (!form.created_at) return '未设置'
  return new Date(form.created_at).toLocaleString()
})

const formattedAccessedAt = computed(() => {
  if (!form.accessed_at) return '从未访问'
  return new Date(form.accessed_at).toLocaleString()
})

onMounted(async () => {
  await Promise.all([
    loadGroups(),
    loadModels()
  ])
})

// Watch for changes to the token prop
watch(() => props.token, (newToken) => {
  if (props.visible && newToken && Object.keys(newToken).length > 0) {
    // If the dialog is open and we have token data, initialize the form
    initFormFromToken(newToken)
  }
}, { immediate: true, deep: true })

// Watch for dialog visibility
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // When dialog opens, initialize from token data if it exists
    if (props.token && Object.keys(props.token).length > 0) {
      initFormFromToken(props.token)
    } else {
      // Reset form for new token
      resetForm()
    }
  }
})

// Initialize form data from token
const initFormFromToken = (token) => {
  if (!token) return

  form.id = token.id || null
  form.name = token.name || ''
  form.group_id = token.group_id || ''
  form.key = token.key || ''
  form.status = token.status || 1
  form.quota = token.quota || 0
  form.expiredAt = token.expired_at ? new Date(token.expired_at) : null
  form.models = token.models || []
  form.subnets = token.subnets || []
  form.created_at = token.created_at || null
  form.accessed_at = token.accessed_at || null
}

// Reset form to default values
const resetForm = () => {
  form.id = null
  form.name = ''
  form.group_id = ''
  form.key = ''
  form.status = 1
  form.quota = 0
  form.expiredAt = null
  form.models = []
  form.subnets = []
  form.created_at = null
  form.accessed_at = null
  
  formRef.value?.resetFields()
}

// 加载分组列表
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

// 加载模型列表
const loadModels = async () => {
  try {
    const res = await getAllModelConfigs()
    availableModels.value = res.data.map(config => config.model)
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error(error)
  }
}

// 复制Token密钥
const copyTokenKey = () => {
  if (!form.key) return
  
  navigator.clipboard.writeText(form.key)
    .then(() => {
      ElMessage.success('Token 密钥已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const data = {
        name: form.name,
        status: form.status,
        quota: form.quota,
        models: form.models,
        subnets: form.subnets,
        expiredAt: form.expiredAt ? form.expiredAt.getTime() : 0
      }
      
      if (props.isEdit) {
        await updateGroupToken(form.group_id, form.id, data)
        ElMessage.success('Token 更新成功')
      } else {
        await addGroupToken(form.group_id, data)
        ElMessage.success('Token 添加成功')
      }
      
      emit('success')
      emit('update:visible', false)
    } catch (error) {
      ElMessage.error(props.isEdit ? 'Token 更新失败' : 'Token 添加失败')
      console.error(error)
    } finally {
      loading.value = false
    }
  })
}

// 对话框关闭处理
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.el-divider {
  margin: 20px 0;
}
</style> 