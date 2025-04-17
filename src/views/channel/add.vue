<template>
  <div class="channel-add-container">
    <h1>{{ isEdit ? '编辑渠道' : '添加渠道' }}</h1>
    
    <el-form 
      ref="formRef" 
      :model="channelForm" 
      :rules="rules" 
      label-width="120px" 
      class="channel-form"
      v-loading="loading"
    >
      <el-form-item label="渠道名称" prop="name">
        <el-input v-model="channelForm.name" placeholder="请输入渠道名称" />
      </el-form-item>
      
      <el-form-item label="渠道类型" prop="type">
        <el-select v-model="channelForm.type" placeholder="请选择渠道类型" @change="handleTypeChange">
          <el-option 
            v-for="(name, type) in channelTypeNames" 
            :key="type" 
            :label="name" 
            :value="Number(type)"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="API密钥" prop="key">
        <el-input 
          v-model="channelForm.key" 
          type="textarea" 
          rows="3" 
          placeholder="请输入API密钥，多个密钥请换行输入" 
        />
        <div class="key-help" v-if="selectedTypeMeta && selectedTypeMeta.keyHelp">
          <el-alert
            type="info"
            :title="`${channelTypeNames[channelForm.type] || ''}密钥格式说明`"
            :description="selectedTypeMeta.keyHelp"
            show-icon
            :closable="false"
          />
        </div>
      </el-form-item>
      
      <el-form-item label="基础URL" prop="base_url">
        <el-input 
          v-model="channelForm.base_url" 
          placeholder="请输入基础URL，默认使用官方API地址" 
        />
        <div class="base-url-help" v-if="selectedTypeMeta && selectedTypeMeta.defaultBaseUrl">
          <el-tag type="info">默认URL: {{ selectedTypeMeta.defaultBaseUrl }}</el-tag>
          <el-button 
            type="primary" 
            link 
            @click="channelForm.base_url = selectedTypeMeta.defaultBaseUrl"
          >
            使用默认
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="channelForm.status">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="2">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="优先级" prop="priority">
        <el-input-number v-model="channelForm.priority" :min="1" :max="100" />
        <span class="form-help">数字越小优先级越高，默认为10</span>
      </el-form-item>
      
      <el-form-item label="模型列表" prop="models">
        <el-select 
          v-model="channelForm.models" 
          multiple 
          filterable 
          allow-create 
          default-first-option 
          placeholder="请选择或添加支持的模型"
        >
          <el-option 
            v-for="model in availableModels" 
            :key="model" 
            :label="model" 
            :value="model" 
          />
        </el-select>
        <div class="models-actions" v-if="channelForm.type">
          <el-button type="primary" link @click="loadDefaultModels">
            加载默认模型
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="模型映射" v-if="channelForm.models.length > 0">
        <div class="model-mapping-container">
          <div v-for="(model, index) in channelForm.models" :key="index" class="model-mapping-item">
            <span class="model-name">{{ model }}</span>
            <el-input 
              v-model="channelForm.model_mapping[model]" 
              placeholder="请输入映射到的模型名称（可选）" 
            />
          </div>
        </div>
      </el-form-item>
      
      <el-form-item label="分组" prop="sets">
        <el-select 
          v-model="channelForm.sets" 
          multiple 
          filterable 
          allow-create 
          default-first-option 
          placeholder="请选择或添加分组"
        >
          <el-option label="default" value="default" />
        </el-select>
        <span class="form-help">留空默认为default组</span>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="submitting">{{ isEdit ? '更新' : '提交' }}</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button @click="goBack">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  addChannel, 
  getChannelById, 
  updateChannel, 
  getChannelTypeMetas, 
  getChannelTypeNames as apiGetChannelTypeNames,
  getChannelDefaultModelsByType
} from '@/api/channel'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

// 判断是否为编辑模式
const channelId = computed(() => route.query.id ? parseInt(route.query.id) : null)
const isEdit = computed(() => !!channelId.value)

// 渠道表单数据
const channelForm = reactive({
  name: '',
  type: '',
  key: '',
  base_url: '',
  status: 1,
  priority: 10,
  models: [],
  model_mapping: {},
  sets: ['default'],
  config: {
    split_think: false
  }
})

// 渠道类型名称
const channelTypeNames = ref({})
const channelTypeMetas = ref({})
const selectedTypeMeta = computed(() => 
  channelForm.type ? channelTypeMetas.value[channelForm.type] : null
)

// 可用模型列表
const availableModels = ref([
  'gpt-3.5-turbo',
  'gpt-4',
  'gpt-4-turbo',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
])

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入渠道名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择渠道类型', trigger: 'change' }
  ],
  key: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
}

// 加载渠道类型
const loadChannelTypes = async () => {
  try {
    const [typeNamesRes, typeMetasRes] = await Promise.all([
      apiGetChannelTypeNames(),
      getChannelTypeMetas()
    ])
    channelTypeNames.value = typeNamesRes.data || {}
    channelTypeMetas.value = typeMetasRes.data || {}
  } catch (error) {
    ElMessage.error('获取渠道类型失败')
    console.error(error)
  }
}

// 当渠道类型改变时
const handleTypeChange = () => {
  // 如果没有设置基础URL，并且有默认URL，则设置为默认URL
  if (!channelForm.base_url && selectedTypeMeta.value?.defaultBaseUrl) {
    channelForm.base_url = selectedTypeMeta.value.defaultBaseUrl
  }
}

// 加载默认模型
const loadDefaultModels = async () => {
  if (!channelForm.type) {
    ElMessage.warning('请先选择渠道类型')
    return
  }
  
  try {
    const res = await getChannelDefaultModelsByType(channelForm.type)
    if (res.data && res.data.models) {
      channelForm.models = res.data.models || []
      channelForm.model_mapping = res.data.mapping || {}
      ElMessage.success('加载默认模型成功')
    } else {
      ElMessage.info('该渠道类型没有默认模型配置')
    }
  } catch (error) {
    console.error('加载默认模型失败', error)
    ElMessage.error('加载默认模型失败')
    
    // 如果API失败，使用本地默认配置作为备选
    if (channelForm.type === 1) { // OpenAI
      channelForm.models = [
        'gpt-3.5-turbo', 
        'gpt-4', 
        'gpt-4-turbo', 
        'gpt-4-vision-preview',
        'text-embedding-ada-002'
      ]
    } else if (channelForm.type === 14) { // Anthropic
      channelForm.models = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0'
      ]
    } else if (channelForm.type === 24) { // Gemini
      channelForm.models = [
        'gemini-pro',
        'gemini-pro-vision'
      ]
    }
  }
}

// 加载渠道详情（编辑模式）
const loadChannelDetail = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    const res = await getChannelById(channelId.value)
    const channel = res.data
    
    // 填充表单数据
    channelForm.name = channel.name
    channelForm.type = channel.type
    channelForm.key = channel.key
    channelForm.base_url = channel.base_url
    channelForm.status = channel.status
    channelForm.priority = channel.priority
    channelForm.models = channel.models || []
    channelForm.model_mapping = channel.model_mapping || {}
    channelForm.sets = channel.sets?.length ? channel.sets : ['default']
    channelForm.config = channel.config || { split_think: false }
    
  } catch (error) {
    ElMessage.error('获取渠道详情失败')
    console.error(error)
    router.push('/channel/list')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请正确填写表单内容')
      return
    }
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateChannel(channelId.value, channelForm)
        ElMessage.success('更新渠道成功')
      } else {
        await addChannel(channelForm)
        ElMessage.success('添加渠道成功')
      }
      router.push('/channel/list')
    } catch (error) {
      ElMessage.error(isEdit.value ? '更新渠道失败' : '添加渠道失败')
      console.error(error)
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (isEdit.value) {
    ElMessageBox.confirm(
      '确定要重置表单吗？这将丢失所有未保存的编辑内容。',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      loadChannelDetail()
    }).catch(() => {})
  } else {
    formRef.value?.resetFields()
    channelForm.model_mapping = {}
  }
}

// 返回列表页
const goBack = () => {
  router.push('/channel/list')
}

onMounted(async () => {
  await loadChannelTypes()
  await loadChannelDetail()
})
</script>

<style scoped>
.channel-add-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.channel-form {
  margin-top: 20px;
}

.key-help, .base-url-help {
  margin-top: 8px;
}

.form-help {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.model-mapping-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-mapping-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-name {
  min-width: 200px;
  font-weight: bold;
}

.models-actions {
  margin-top: 8px;
}
</style> 