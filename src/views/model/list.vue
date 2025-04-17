<template>
  <div class="model-list-container">
    <div class="model-header">
      <h1>模型列表</h1>
      <div class="model-actions">
        <el-button type="primary" @click="addModel">添加模型</el-button>
        <el-button type="danger" :disabled="selectedModels.length === 0" @click="batchDeleteModels">批量删除</el-button>
        <el-button type="primary" @click="refreshModels">刷新</el-button>
      </div>
    </div>
    
    <div class="model-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索模型名称" clearable @keyup.enter="searchModels" />
        </el-form-item>
        <el-form-item label="拥有者">
          <el-select v-model="searchForm.owner" placeholder="选择拥有者" clearable>
            <el-option
              v-for="owner in ['openai', 'anthropic', 'google', 'local']"
              :key="owner"
              :label="owner"
              :value="owner"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchModels">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table
      v-loading="loading"
      :data="models"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="model" label="模型名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="owner" label="拥有者" width="120" />
      <el-table-column label="类型" width="120">
        <template #default="scope">
          {{ getModelTypeName(scope.row.type) }}
        </template>
      </el-table-column>
      <el-table-column label="输入价格" width="120">
        <template #default="scope">
          <span>{{ scope.row.price?.input_price ? '$' + scope.row.price.input_price : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="输出价格" width="120">
        <template #default="scope">
          <span>{{ scope.row.price?.output_price ? '$' + scope.row.price.output_price : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="RPM限制" width="120">
        <template #default="scope">
          <span>{{ scope.row.rpm || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="TPM限制" width="120">
        <template #default="scope">
          <span>{{ scope.row.tpm || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="scope">
          <el-button size="small" type="primary" @click="editModel(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteModel(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  getModelConfigs, 
  searchModelConfigs, 
  deleteModelConfig, 
  deleteModelConfigs as apiDeleteModelConfigs
} from '@/api/model'

const router = useRouter()
const loading = ref(false)
const models = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedModels = ref([])

const searchForm = reactive({
  keyword: '',
  owner: '',
})

// 定义模型类型名称
const modelTypes = {
  0: '文本',
  1: '聊天',
  2: '插件',
  3: '图像',
  4: '嵌入'
}

// 获取模型类型名称
const getModelTypeName = (type) => {
  return modelTypes[type] || `未知类型(${type})`
}

// 加载模型列表
const loadModels = async () => {
  if (loading.value) return // 防止重复加载
  
  loading.value = true
  try {
    const res = await getModelConfigs({
      page: currentPage.value,
      per_page: pageSize.value
    })
    models.value = res.data.configs
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 添加模型
const addModel = () => {
  router.push('/model/config')
}

// 编辑模型
const editModel = (model) => {
  router.push(`/model/config?model=${encodeURIComponent(model.model)}`)
}

// 删除模型
const deleteModel = (model) => {
  ElMessageBox.confirm(
    `确定要删除模型 "${model.model}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteModelConfig(model.model)
      ElMessage.success('删除成功')
      loadModels()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 批量删除模型
const batchDeleteModels = () => {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请选择要删除的模型')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedModels.value.length} 个模型吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const modelNames = selectedModels.value.map(item => item.model)
      await apiDeleteModelConfigs(modelNames)
      ElMessage.success('批量删除成功')
      loadModels()
    } catch (error) {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 选择项变化
const handleSelectionChange = (val) => {
  selectedModels.value = val
}

// 刷新列表
const refreshModels = () => {
  loadModels()
}

// 搜索模型
const searchModels = async () => {
  loading.value = true
  try {
    const res = await searchModelConfigs({
      keyword: searchForm.keyword,
      owner: searchForm.owner,
      page: currentPage.value,
      per_page: pageSize.value
    })
    models.value = res.data.configs
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('搜索失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.owner = ''
  loadModels()
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadModels()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadModels()
}

onMounted(() => {
  // 确保页面加载时立即获取数据
  loadModels()
})

// 当页面从缓存中被激活时也重新加载数据
onActivated(() => {
  loadModels()
})
</script>

<style scoped>
.model-list-container {
  padding: 20px;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.model-search {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 