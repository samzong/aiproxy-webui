<template>
  <el-dialog
    :title="isEdit ? '编辑渠道' : '添加渠道'"
    v-model="visible"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="渠道名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入渠道名称" />
      </el-form-item>
      
      <el-form-item label="渠道类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择渠道类型" @change="handleTypeChange" style="width: 100%">
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
          v-model="form.key"
          type="textarea"
          :rows="3"
          placeholder="请输入API密钥，多个密钥请换行分隔"
        />
      </el-form-item>
      
      <el-form-item label="基础URL" prop="base_url" v-if="selectedChannelMeta?.base_url_required">
        <el-input v-model="form.base_url" placeholder="请输入基础URL" />
      </el-form-item>
      
      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="form.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
      
      <el-form-item label="优先级" prop="priority">
        <el-input-number v-model="form.priority" :min="0" :max="100" />
      </el-form-item>
      
      <el-form-item label="支持的模型">
        <el-select
          v-model="form.models"
          multiple
          filterable
          placeholder="请选择支持的模型"
          style="width: 100%"
        >
          <el-option
            v-for="model in availableModels"
            :key="model.model"
            :label="model.model"
            :value="model.model"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="模型映射">
        <div v-for="(model, index) in form.models" :key="index" class="model-mapping-item">
          <span class="model-name">{{ model }}:</span>
          <el-input
            v-model="form.model_mapping[model]"
            placeholder="映射到的实际模型名称"
            style="width: 280px; margin-left: 10px;"
          />
        </div>
      </el-form-item>
      
      <template v-if="form.type && selectedChannelMeta?.config_schema">
        <el-divider content-position="left">高级配置</el-divider>
        <component 
          :is="getConfigComponent(form.type)" 
          v-model:config="form.config"
          :channel-type="form.type"
        />
      </template>
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
  getChannelTypeNames, 
  getChannelTypeMetas, 
  getChannelById, 
  addChannel, 
  updateChannel,
  getChannelDefaultModelsByType
} from '@/api/channel'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  channel: {
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
const channelTypeNames = ref({})
const channelTypeMetas = ref({})
const availableModels = ref([])

const form = reactive({
  name: '',
  type: '',
  key: '',
  base_url: '',
  status: 1,
  priority: 0,
  models: [],
  model_mapping: {},
  config: {}
})

const rules = reactive({
  name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择渠道类型', trigger: 'change' }],
  key: [{ required: true, message: '请输入API密钥', trigger: 'blur' }]
})

const selectedChannelMeta = computed(() => {
  if (!form.type || Object.keys(channelTypeMetas.value).length === 0) {
    return null
  }
  return channelTypeMetas.value[form.type]
})

onMounted(async () => {
  await Promise.all([
    loadChannelTypeNames(),
    loadChannelTypeMetas()
  ])
  
  if (props.isEdit && props.channel && props.channel.id) {
    await loadChannelDetail(props.channel.id)
  }
})

// 加载渠道类型名称
const loadChannelTypeNames = async () => {
  try {
    const res = await getChannelTypeNames()
    channelTypeNames.value = res.data
  } catch (error) {
    ElMessage.error('获取渠道类型失败')
    console.error(error)
  }
}

// 加载渠道类型元数据
const loadChannelTypeMetas = async () => {
  try {
    const res = await getChannelTypeMetas()
    channelTypeMetas.value = res.data
  } catch (error) {
    ElMessage.error('获取渠道类型元数据失败')
    console.error(error)
  }
}

// 加载渠道详情
const loadChannelDetail = async (id) => {
  loading.value = true
  try {
    const res = await getChannelById(id)
    const channelData = res.data
    
    form.name = channelData.name
    form.type = channelData.type
    form.key = channelData.key
    form.base_url = channelData.base_url
    form.status = channelData.status
    form.priority = channelData.priority
    form.models = channelData.models || []
    form.model_mapping = channelData.model_mapping || {}
    form.config = channelData.config || {}
    
    // 加载该类型支持的模型
    if (form.type) {
      await loadModels(form.type)
    }
  } catch (error) {
    ElMessage.error('获取渠道详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 渠道类型变更处理
const handleTypeChange = async (value) => {
  form.base_url = ''
  form.models = []
  form.model_mapping = {}
  form.config = {}
  
  if (value) {
    await loadModels(value)
  }
}

// 加载模型列表
const loadModels = async (type) => {
  try {
    const res = await getChannelDefaultModelsByType(type)
    if (res.data && res.data.models) {
      availableModels.value = res.data.models.map(model => ({ model }))
      
      // 如果是新建，默认填入该类型所有支持的模型
      if (!props.isEdit) {
        form.models = [...res.data.models]
        // 默认填充模型映射
        if (res.data.mapping) {
          form.model_mapping = { ...res.data.mapping }
        }
      }
    }
  } catch (error) {
    ElMessage.error('获取支持的模型列表失败')
    console.error(error)
  }
}

// 根据渠道类型获取对应的配置组件
const getConfigComponent = (type) => {
  // 这里可以根据不同的渠道类型返回不同的配置组件
  // 如果没有特定的配置组件，返回默认的JSON编辑器
  return 'JsonEditor'
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
        type: form.type,
        key: form.key,
        base_url: form.base_url,
        status: form.status,
        priority: form.priority,
        models: form.models,
        model_mapping: form.model_mapping,
        config: form.config
      }
      
      if (props.isEdit) {
        await updateChannel(props.channel.id, data)
        ElMessage.success('更新渠道成功')
      } else {
        await addChannel(data)
        ElMessage.success('添加渠道成功')
      }
      
      emit('success')
      emit('update:visible', false)
    } catch (error) {
      ElMessage.error(props.isEdit ? '更新渠道失败' : '添加渠道失败')
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

// 监听visible变化，重置表单
watch(() => props.visible, (val) => {
  if (!val) {
    formRef.value?.resetFields()
  }
})
</script>

<style scoped>
.model-mapping-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.model-name {
  width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 