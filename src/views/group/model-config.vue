<template>
  <div class="group-model-config-container">
    <div class="group-model-config-header">
      <h1>{{ groupId }} - 模型配置</h1>
      <div class="group-model-config-actions">
        <el-button type="primary" @click="showAddModelDialog">添加模型配置</el-button>
        <el-button type="danger" :disabled="selectedModels.length === 0" @click="batchDeleteModels">批量删除</el-button>
        <el-button type="primary" @click="refreshModelConfigs">刷新</el-button>
        <el-button type="success" @click="goBack">返回</el-button>
      </div>
    </div>
    
    <el-table
      v-loading="loading"
      :data="modelConfigs"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="model" label="模型名称" min-width="200" />
      <el-table-column label="是否覆盖限流" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.override_limit ? 'success' : 'info'">
            {{ scope.row.override_limit ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rpm" label="每分钟请求数(RPM)" width="160">
        <template #default="scope">
          <span>{{ scope.row.override_limit ? scope.row.rpm : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="tpm" label="每分钟令牌数(TPM)" width="160">
        <template #default="scope">
          <span>{{ scope.row.override_limit ? scope.row.tpm : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否覆盖价格" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.override_price ? 'success' : 'info'">
            {{ scope.row.override_price ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="输入价格" min-width="120">
        <template #default="scope">
          <span v-if="scope.row.override_price">{{ formatPrice(scope.row.price?.input) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="输出价格" min-width="120">
        <template #default="scope">
          <span v-if="scope.row.override_price">{{ formatPrice(scope.row.price?.output) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="图片价格" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <div v-if="scope.row.override_price && scope.row.image_prices">
            <div v-for="(price, key) in scope.row.image_prices" :key="key">
              {{ key }}: {{ price }}
            </div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="scope">
          <el-button size="small" type="primary" @click="editModelConfig(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteModelConfig(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 模型配置表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模型配置' : '添加模型配置'"
      width="650px"
      destroy-on-close
    >
      <el-form :model="modelForm" label-width="120px" :rules="rules" ref="modelFormRef">
        <el-form-item label="模型名称" prop="model">
          <el-select 
            v-if="!isEdit" 
            v-model="modelForm.model" 
            placeholder="选择模型"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="model in availableModels"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
          <el-input v-else v-model="modelForm.model" disabled />
        </el-form-item>
        
        <el-divider content-position="center">限流设置</el-divider>
        
        <el-form-item label="覆盖限流设置">
          <el-switch v-model="modelForm.override_limit" />
        </el-form-item>
        
        <template v-if="modelForm.override_limit">
          <el-form-item label="每分钟请求数" prop="rpm">
            <el-input-number v-model="modelForm.rpm" :min="0" style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="每分钟令牌数" prop="tpm">
            <el-input-number v-model="modelForm.tpm" :min="0" style="width: 100%" />
          </el-form-item>
        </template>
        
        <el-divider content-position="center">价格设置</el-divider>
        
        <el-form-item label="覆盖价格设置">
          <el-switch v-model="modelForm.override_price" />
        </el-form-item>
        
        <template v-if="modelForm.override_price">
          <el-form-item label="输入价格">
            <el-input-number v-model="modelForm.price.input" :min="0" :precision="8" :step="0.0001" style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="输出价格">
            <el-input-number v-model="modelForm.price.output" :min="0" :precision="8" :step="0.0001" style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="图片价格">
            <div v-for="(price, index) in imagePrices" :key="index" class="image-price-item">
              <el-input v-model="imagePrices[index].key" placeholder="分辨率(如 1024x1024)" style="width: 40%" />
              <el-input-number v-model="imagePrices[index].value" :min="0" :precision="8" :step="0.0001" style="width: 40%" />
              <el-button type="danger" @click="removeImagePrice(index)" :disabled="imagePrices.length <= 1">删除</el-button>
            </div>
            <el-button type="primary" @click="addImagePrice" style="margin-top: 10px">添加图片价格</el-button>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 组设置表单对话框 -->
    <el-dialog
      v-model="groupConfigDialogVisible"
      title="组全局设置"
      width="550px"
      destroy-on-close
    >
      <el-form :model="groupConfigForm" label-width="180px" ref="groupConfigFormRef">
        <el-form-item label="RPM 比率" prop="rpm_ratio">
          <el-tooltip content="组所有请求速率的整体比例因子，1.0 表示正常速率" placement="right">
            <el-input-number v-model="groupConfigForm.rpm_ratio" :min="0" :max="10" :step="0.1" :precision="2" style="width: 100%" />
          </el-tooltip>
        </el-form-item>
        
        <el-form-item label="TPM 比率" prop="tpm_ratio">
          <el-tooltip content="组所有令牌速率的整体比例因子，1.0 表示正常速率" placement="right">
            <el-input-number v-model="groupConfigForm.tpm_ratio" :min="0" :max="10" :step="0.1" :precision="2" style="width: 100%" />
          </el-tooltip>
        </el-form-item>
        
        <el-divider content-position="center">余额警报设置</el-divider>
        
        <el-form-item label="启用余额警报">
          <el-switch v-model="groupConfigForm.balance_alert_enabled" />
        </el-form-item>
        
        <el-form-item label="余额警报阈值" v-if="groupConfigForm.balance_alert_enabled" prop="balance_alert_threshold">
          <el-input-number v-model="groupConfigForm.balance_alert_threshold" :min="0" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupConfigDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGroupConfigForm" :loading="groupConfigSubmitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 悬浮按钮 -->
    <div class="floating-button">
      <el-button type="primary" circle @click="showGroupConfigDialog">
        <el-icon><Setting /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getGroupModelConfigs,
  getGroupModelConfig,
  saveGroupModelConfig,
  updateGroupModelConfig,
  deleteGroupModelConfig as apiDeleteGroupModelConfig,
  deleteGroupModelConfigs as apiDeleteGroupModelConfigs,
  updateGroupRPMRatio,
  updateGroupTPMRatio,
  updateGroupBalanceAlert,
  getGroup,
} from '@/api/group'
import { getAllModelConfigs } from '@/api/model'

const route = useRoute()
const router = useRouter()
const groupId = computed(() => route.params.id)

// 状态变量
const loading = ref(false)
const submitLoading = ref(false)
const groupConfigSubmitLoading = ref(false)
const modelConfigs = ref([])
const selectedModels = ref([])
const dialogVisible = ref(false)
const groupConfigDialogVisible = ref(false)
const isEdit = ref(false)
const modelFormRef = ref(null)
const groupConfigFormRef = ref(null)
const availableModels = ref([])
const imagePrices = ref([{ key: '', value: 0 }])

// 模型表单数据
const modelForm = reactive({
  model: '',
  override_limit: false,
  rpm: 0,
  tpm: 0,
  override_price: false,
  price: {
    input: 0,
    output: 0
  },
  image_prices: {}
})

// 组设置表单数据
const groupConfigForm = reactive({
  rpm_ratio: 1.0,
  tpm_ratio: 1.0,
  balance_alert_enabled: false,
  balance_alert_threshold: 0
})

// 表单验证规则
const rules = {
  model: [
    { required: true, message: '请选择模型', trigger: 'change' }
  ],
}

// 加载模型配置列表
const loadModelConfigs = async () => {
  if (loading.value || !groupId.value) return
  
  loading.value = true
  try {
    const res = await getGroupModelConfigs(groupId.value)
    modelConfigs.value = res.data
  } catch (error) {
    ElMessage.error('获取模型配置列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载组配置
const loadGroupConfig = async () => {
  if (!groupId.value) return
  
  try {
    const res = await getGroup(groupId.value)
    const groupData = res.data
    
    groupConfigForm.rpm_ratio = groupData.rpm_ratio || 1.0
    groupConfigForm.tpm_ratio = groupData.tpm_ratio || 1.0
    groupConfigForm.balance_alert_enabled = groupData.balance_alert_enabled || false
    groupConfigForm.balance_alert_threshold = groupData.balance_alert_threshold || 0
  } catch (error) {
    ElMessage.error('获取组配置失败')
    console.error(error)
  }
}

// 加载可用模型列表
const loadAvailableModels = async () => {
  try {
    const res = await getAllModelConfigs()
    const allModels = res.data.map(config => config.model)
    const configuredModels = modelConfigs.value.map(config => config.model)
    
    // 过滤掉已经配置的模型
    availableModels.value = allModels.filter(model => !configuredModels.includes(model))
  } catch (error) {
    ElMessage.error('获取可用模型失败')
    console.error(error)
  }
}

// 格式化价格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '-'
  return price.toFixed(8)
}

// 刷新模型配置列表
const refreshModelConfigs = () => {
  loadModelConfigs()
  loadAvailableModels()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 显示添加模型对话框
const showAddModelDialog = () => {
  isEdit.value = false
  
  // 重置表单
  modelForm.model = ''
  modelForm.override_limit = false
  modelForm.rpm = 0
  modelForm.tpm = 0
  modelForm.override_price = false
  modelForm.price.input = 0
  modelForm.price.output = 0
  modelForm.image_prices = {}
  
  imagePrices.value = [{ key: '', value: 0 }]
  
  loadAvailableModels()
  dialogVisible.value = true
}

// 编辑模型配置
const editModelConfig = async (config) => {
  isEdit.value = true
  
  try {
    const res = await getGroupModelConfig(groupId.value, config.model)
    const configData = res.data
    
    // 填充表单数据
    modelForm.model = configData.model
    modelForm.override_limit = configData.override_limit || false
    modelForm.rpm = configData.rpm || 0
    modelForm.tpm = configData.tpm || 0
    modelForm.override_price = configData.override_price || false
    modelForm.price = configData.price || { input: 0, output: 0 }
    modelForm.image_prices = configData.image_prices || {}
    
    // 转换图片价格为表单可用格式
    imagePrices.value = Object.entries(modelForm.image_prices).map(([key, value]) => ({ key, value }))
    if (imagePrices.value.length === 0) {
      imagePrices.value = [{ key: '', value: 0 }]
    }
    
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取模型配置详情失败')
    console.error(error)
  }
}

// 添加图片价格项
const addImagePrice = () => {
  imagePrices.value.push({ key: '', value: 0 })
}

// 移除图片价格项
const removeImagePrice = (index) => {
  imagePrices.value.splice(index, 1)
}

// 提交模型配置表单
const submitForm = async () => {
  if (!modelFormRef.value) return
  
  await modelFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      // 构建图片价格对象
      const imagePricesObj = {}
      imagePrices.value.forEach(item => {
        if (item.key && item.key.trim()) {
          imagePricesObj[item.key] = item.value
        }
      })
      
      const data = {
        model: modelForm.model,
        override_limit: modelForm.override_limit,
        rpm: modelForm.rpm,
        tpm: modelForm.tpm,
        override_price: modelForm.override_price,
        image_prices: imagePricesObj,
        price: modelForm.price
      }
      
      if (isEdit.value) {
        await updateGroupModelConfig(groupId.value, modelForm.model, data)
        ElMessage.success('模型配置更新成功')
      } else {
        await saveGroupModelConfig(groupId.value, data)
        ElMessage.success('模型配置添加成功')
      }
      
      dialogVisible.value = false
      refreshModelConfigs()
    } catch (error) {
      ElMessage.error(isEdit.value ? '模型配置更新失败' : '模型配置添加失败')
      console.error(error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 显示组配置对话框
const showGroupConfigDialog = () => {
  loadGroupConfig()
  groupConfigDialogVisible.value = true
}

// 提交组配置表单
const submitGroupConfigForm = async () => {
  groupConfigSubmitLoading.value = true
  
  try {
    // 更新 RPM 比率
    await updateGroupRPMRatio(groupId.value, { rpm_ratio: groupConfigForm.rpm_ratio })
    
    // 更新 TPM 比率
    await updateGroupTPMRatio(groupId.value, { tpm_ratio: groupConfigForm.tpm_ratio })
    
    // 更新余额警报设置
    await updateGroupBalanceAlert(groupId.value, {
      balance_alert_enabled: groupConfigForm.balance_alert_enabled,
      balance_alert_threshold: groupConfigForm.balance_alert_threshold
    })
    
    ElMessage.success('组配置更新成功')
    groupConfigDialogVisible.value = false
  } catch (error) {
    ElMessage.error('组配置更新失败')
    console.error(error)
  } finally {
    groupConfigSubmitLoading.value = false
  }
}

// 删除模型配置
const deleteModelConfig = (config) => {
  ElMessageBox.confirm(
    `确定要删除模型 "${config.model}" 的配置吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await apiDeleteGroupModelConfig(groupId.value, config.model)
      ElMessage.success('删除成功')
      refreshModelConfigs()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 批量删除模型配置
const batchDeleteModels = () => {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请选择要删除的模型配置')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedModels.value.length} 个模型配置吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const models = selectedModels.value.map(item => item.model)
      await apiDeleteGroupModelConfigs(groupId.value, models)
      ElMessage.success('批量删除成功')
      refreshModelConfigs()
    } catch (error) {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 处理表格多选变化
const handleSelectionChange = (selection) => {
  selectedModels.value = selection
}

// 生命周期钩子
onMounted(() => {
  if (!groupId.value) {
    ElMessage.error('缺少组 ID 参数')
    router.push('/group/list')
    return
  }
  
  loadModelConfigs()
  loadAvailableModels()
})
</script>

<style scoped>
.group-model-config-container {
  padding: 20px;
}

.group-model-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.group-model-config-header h1 {
  margin: 0;
  font-size: 24px;
}

.group-model-config-actions {
  display: flex;
  gap: 10px;
}

.image-price-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.floating-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
}
</style> 