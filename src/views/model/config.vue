<template>
  <div class="model-config-container">
    <div class="model-config-header">
      <h1>{{ isEdit ? '编辑模型' : '添加模型' }}</h1>
    </div>
    
    <el-form
      ref="formRef"
      :model="modelForm"
      :rules="rules"
      label-width="120px"
      class="model-form"
      v-loading="loading"
    >
      <el-form-item label="模型名称" prop="model">
        <el-input 
          v-model="modelForm.model" 
          placeholder="请输入模型名称"
          :disabled="isEdit"
        />
      </el-form-item>
      
      <el-form-item label="拥有者" prop="owner">
        <el-select v-model="modelForm.owner" placeholder="请选择模型拥有者">
          <el-option label="OpenAI" value="openai" />
          <el-option label="Anthropic" value="anthropic" />
          <el-option label="Google" value="google" />
          <el-option label="Local" value="local" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="模型类型" prop="type">
        <el-select v-model="modelForm.type" placeholder="请选择模型类型">
          <el-option label="文本" :value="0" />
          <el-option label="聊天" :value="1" />
          <el-option label="插件" :value="2" />
          <el-option label="图像" :value="3" />
          <el-option label="嵌入" :value="4" />
        </el-select>
      </el-form-item>
      
      <el-divider content-position="left">价格设置</el-divider>
      
      <el-form-item label="输入价格">
        <el-input-number 
          v-model="modelForm.price.input_price" 
          :min="0" 
          :precision="6" 
          :step="0.000001" 
          placeholder="请输入每1K tokens的价格"
        />
        <span class="form-help">每1K tokens的价格（美元）</span>
      </el-form-item>
      
      <el-form-item label="输出价格">
        <el-input-number 
          v-model="modelForm.price.output_price" 
          :min="0" 
          :precision="6" 
          :step="0.000001" 
          placeholder="请输入每1K tokens的价格"
        />
        <span class="form-help">每1K tokens的价格（美元）</span>
      </el-form-item>
      
      <el-divider content-position="left">限制设置</el-divider>
      
      <el-form-item label="RPM限制">
        <el-input-number 
          v-model="modelForm.rpm" 
          :min="0" 
          :step="1" 
          placeholder="请输入每分钟请求数限制"
        />
        <span class="form-help">每分钟请求数限制，0表示不限制</span>
      </el-form-item>
      
      <el-form-item label="TPM限制">
        <el-input-number 
          v-model="modelForm.tpm" 
          :min="0" 
          :step="1000" 
          placeholder="请输入每分钟token数限制"
        />
        <span class="form-help">每分钟token数限制，0表示不限制</span>
      </el-form-item>
      
      <el-form-item label="排除测试">
        <el-switch 
          v-model="modelForm.exclude_from_tests" 
          active-text="是" 
          inactive-text="否"
        />
        <span class="form-help">是否从系统测试中排除此模型</span>
      </el-form-item>
      
      <el-divider content-position="left">高级设置</el-divider>
      
      <el-form-item label="配置">
        <el-input
          v-model="configJson"
          type="textarea"
          rows="4"
          placeholder="请输入模型配置（JSON格式）"
        />
        <span class="form-help">可选配置项，JSON格式</span>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getModelConfig, saveModelConfig } from '@/api/model'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const configJson = ref('{}')

// 判断是否为编辑模式
const modelName = computed(() => route.query.model || '')
const isEdit = computed(() => !!modelName.value)

// 模型表单数据
const modelForm = reactive({
  model: '',
  owner: 'openai',
  type: 1, // 默认为聊天类型
  rpm: 0,
  tpm: 0,
  exclude_from_tests: false,
  price: {
    input_price: 0,
    output_price: 0
  },
  config: {}
})

// 表单验证规则
const rules = {
  model: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  owner: [
    { required: true, message: '请选择模型拥有者', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择模型类型', trigger: 'change' }
  ]
}

// 监听配置JSON变化
watch(configJson, (newVal) => {
  try {
    modelForm.config = JSON.parse(newVal)
  } catch (error) {
    // JSON解析错误，不更新config
    console.error('无效的JSON格式', error)
  }
})

// 加载模型详情（编辑模式）
const loadModelDetail = async () => {
  if (!modelName.value) return
  
  loading.value = true
  try {
    const res = await getModelConfig(modelName.value)
    if (res.data) {
      const data = res.data
      modelForm.model = data.model
      modelForm.owner = data.owner
      modelForm.type = data.type
      modelForm.rpm = data.rpm || 0
      modelForm.tpm = data.tpm || 0
      modelForm.exclude_from_tests = data.exclude_from_tests || false
      modelForm.price = {
        input_price: data.price?.input_price || 0,
        output_price: data.price?.output_price || 0
      }
      modelForm.config = data.config || {}
      configJson.value = JSON.stringify(data.config || {}, null, 2)
    }
  } catch (error) {
    ElMessage.error('获取模型详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 处理config字段
        try {
          modelForm.config = JSON.parse(configJson.value)
        } catch (error) {
          ElMessage.warning('配置JSON格式不正确，将使用空对象')
          modelForm.config = {}
        }
        
        await saveModelConfig(modelForm)
        ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
        goBack()
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
        console.error(error)
      } finally {
        submitting.value = false
      }
    } else {
      return false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  if (isEdit.value) {
    loadModelDetail()
  } else {
    configJson.value = '{}'
  }
}

// 返回列表页
const goBack = () => {
  router.push('/model/list')
}

onMounted(() => {
  if (isEdit.value) {
    loadModelDetail()
  }
})
</script>

<style scoped>
.model-config-container {
  padding: 20px;
}

.model-config-header {
  margin-bottom: 20px;
}

.model-form {
  max-width: 800px;
}

.form-help {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

.el-divider {
  margin: 24px 0;
}
</style>