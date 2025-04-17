<template>
  <div class="token-list-container">
    <div class="token-header">
      <h1>Token 管理</h1>
      <div class="token-actions">
        <el-button type="primary" @click="navigateToAdd">添加 Token</el-button>
        <el-button type="danger" :disabled="selectedTokens.length === 0" @click="batchDeleteTokens">批量删除</el-button>
        <el-button type="primary" @click="refreshTokens">刷新</el-button>
      </div>
    </div>
    
    <div class="token-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索 Token" clearable @keyup.enter="searchTokens" />
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="searchForm.group" placeholder="选择分组" clearable>
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.id"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option :key="1" label="启用" :value="1" />
            <el-option :key="2" label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTokens">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table
      v-loading="loading"
      :data="tokens"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="key" label="密钥" min-width="220" show-overflow-tooltip />
      <el-table-column prop="group_id" label="分组" min-width="120" />
      <el-table-column label="模型限制" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <template v-if="scope.row.models && scope.row.models.length">
            <el-tag type="info" v-for="model in scope.row.models" :key="model" class="model-tag">
              {{ model }}
            </el-tag>
          </template>
          <span v-else>无限制</span>
        </template>
      </el-table-column>
      <el-table-column label="子网限制" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <template v-if="scope.row.subnets && scope.row.subnets.length">
            <el-tag type="info" v-for="subnet in scope.row.subnets" :key="subnet" class="subnet-tag">
              {{ subnet }}
            </el-tag>
          </template>
          <span v-else>无限制</span>
        </template>
      </el-table-column>
      <el-table-column label="配额" width="100">
        <template #default="scope">
          <span>{{ scope.row.quota ? scope.row.quota.toFixed(2) : '无限制' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="过期时间" width="180">
        <template #default="scope">
          {{ scope.row.expired_at ? formatDate(scope.row.expired_at) : '永不过期' }}
        </template>
      </el-table-column>
      <el-table-column label="最后访问" width="180">
        <template #default="scope">
          {{ scope.row.accessed_at ? formatDate(scope.row.accessed_at) : '从未访问' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewTokenDetail(scope.row)">详情</el-button>
          <el-button size="small" type="primary" @click="navigateToEdit(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            :type="scope.row.status === 1 ? 'danger' : 'success'"
            @click="toggleTokenStatus(scope.row)"
          >
            {{ scope.row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteToken(scope.row)">删除</el-button>
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

    <!-- Token 表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑 Token' : '添加 Token'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="tokenForm" label-width="100px" :rules="rules" ref="tokenFormRef">
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
          <el-input-number v-model="tokenForm.quota" :min="0" :precision="2" :step="10" placeholder="Token 配额，0 表示无限制" style="width: 100%" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="tokenForm.expiredAt"
            type="datetime"
            placeholder="选择过期时间，不选则永不过期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  getTokens, 
  getTokenById, 
  addGroupToken, 
  updateGroupToken, 
  deleteToken as apiDeleteToken,
  deleteTokens as apiDeleteTokens,
  updateTokenStatus as apiUpdateTokenStatus,
  searchTokens as apiSearchTokens,
} from '@/api/token'
import { getGroups } from '@/api/group'
import { getAllModelConfigs } from '@/api/model'

const router = useRouter()

// 状态变量
const loading = ref(false)
const submitLoading = ref(false)
const tokens = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedTokens = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const tokenFormRef = ref(null)
const groups = ref([])
const availableModels = ref([])

// 表单数据
const tokenForm = reactive({
  name: '',
  group_id: '',
  models: [],
  subnets: [],
  quota: 0,
  expiredAt: null,
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  group: '',
  status: '',
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

// 加载 Token 列表
const loadTokens = async () => {
  if (loading.value) return // 防止重复加载
  
  loading.value = true
  try {
    const res = await getTokens({
      page: currentPage.value,
      per_page: pageSize.value,
      ...buildSearchParams()
    })
    tokens.value = res.data.tokens
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取 Token 列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
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

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

// 构建搜索参数
const buildSearchParams = () => {
  const params = {}
  if (searchForm.keyword) params.keyword = searchForm.keyword
  if (searchForm.group) params.group = searchForm.group
  if (searchForm.status) params.status = searchForm.status
  return params
}

// 搜索 Token
const searchTokens = () => {
  currentPage.value = 1
  loadTokens()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  searchTokens()
}

// 刷新 Token 列表
const refreshTokens = () => {
  loadTokens()
}

// 显示添加对话框
const navigateToAdd = () => {
  router.push('/token/add')
}

// 编辑 Token - 跳转到编辑页面
const navigateToEdit = (token) => {
  router.push(`/token/add?id=${token.id}`)
}

// 查看Token详情
const viewTokenDetail = (token) => {
  router.push(`/token/detail/${token.id}`)
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
      
      dialogVisible.value = false
      loadTokens()
    } catch (error) {
      ElMessage.error(isEdit.value ? 'Token 更新失败' : 'Token 添加失败')
      console.error(error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 删除 Token
const deleteToken = (token) => {
  ElMessageBox.confirm(
    `确定要删除 Token "${token.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await apiDeleteToken(token.id)
      ElMessage.success('删除成功')
      loadTokens()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 批量删除 Token
const batchDeleteTokens = () => {
  if (selectedTokens.value.length === 0) {
    ElMessage.warning('请选择要删除的 Token')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedTokens.value.length} 个 Token 吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const ids = selectedTokens.value.map(item => item.id)
      await apiDeleteTokens(ids)
      ElMessage.success('批量删除成功')
      loadTokens()
    } catch (error) {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 处理表格多选变化
const handleSelectionChange = (selection) => {
  selectedTokens.value = selection
}

// 切换 Token 状态
const toggleTokenStatus = async (token) => {
  const newStatus = token.status === 1 ? 2 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await apiUpdateTokenStatus(token.id, { status: newStatus })
    ElMessage.success(`${statusText}成功`)
    // 更新本地数据
    const index = tokens.value.findIndex(item => item.id === token.id)
    if (index !== -1) {
      tokens.value[index].status = newStatus
    }
  } catch (error) {
    ElMessage.error(`${statusText}失败`)
    console.error(error)
  }
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  loadTokens()
}

// 处理页数变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  loadTokens()
}

// 生命周期钩子
onMounted(() => {
  loadTokens()
  loadGroups()
  loadModels()
})

onActivated(() => {
  loadTokens()
})
</script>

<style scoped>
.token-list-container {
  padding: 20px;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.token-header h1 {
  margin: 0;
  font-size: 24px;
}

.token-actions {
  display: flex;
  gap: 10px;
}

.token-search {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.model-tag, .subnet-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style> 