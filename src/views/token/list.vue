<template>
  <div class="token-list-container">
    <div class="token-header">
      <h1>Token 管理</h1>
      <div class="token-actions">
        <el-button type="primary" icon="Plus" @click="openTokenDialog(false)">添加 Token</el-button>
        <el-button type="danger" icon="Delete" :disabled="selectedTokens.length === 0" @click="batchDeleteTokens">批量删除</el-button>
        <el-dropdown split-button type="primary" @command="handleCommand">
          更多操作
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="refresh" icon="Refresh">刷新列表</el-dropdown-item>
              <el-dropdown-item command="exportTokens" icon="Download">导出数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="token-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="搜索名称/ID/密钥" 
            clearable 
            prefix-icon="Search"
            @keyup.enter="searchTokens" 
          />
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="searchForm.group" placeholder="所有分组" clearable style="width: 160px;">
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.id"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="所有状态" clearable style="width: 120px;">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="searchForm.order" placeholder="默认排序" clearable style="width: 150px;">
            <el-option label="ID升序" value="id-asc" />
            <el-option label="ID降序" value="id-desc" />
            <el-option label="创建时间升序" value="created_at-asc" />
            <el-option label="创建时间降序" value="created_at-desc" />
            <el-option label="配额升序" value="quota-asc" />
            <el-option label="配额降序" value="quota-desc" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchTokens">搜索</el-button>
          <el-button icon="RefreshRight" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table
      v-loading="loading"
      :data="tokens"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
      stripe
      highlight-current-row
      ref="tokenTable"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="key" label="密钥" min-width="220" show-overflow-tooltip />
      <el-table-column prop="group_id" label="分组" min-width="120" />
      <el-table-column label="模型限制" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <template v-if="scope.row.models && scope.row.models.length">
            <el-tooltip effect="dark" :content="scope.row.models.join(', ')" placement="top">
              <el-badge :value="scope.row.models.length" type="info" />
            </el-tooltip>
          </template>
          <span v-else>无限制</span>
        </template>
      </el-table-column>
      <el-table-column label="子网限制" min-width="120" show-overflow-tooltip>
        <template #default="scope">
          <template v-if="scope.row.subnets && scope.row.subnets.length">
            <el-tooltip effect="dark" :content="scope.row.subnets.join(', ')" placement="top">
              <el-badge :value="scope.row.subnets.length" type="info" />
            </el-tooltip>
          </template>
          <span v-else>无限制</span>
        </template>
      </el-table-column>
      <el-table-column label="配额" width="100">
        <template #default="scope">
          <span>{{ scope.row.quota ? `$${scope.row.quota.toFixed(2)}` : '无限制' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" :filters="[
        { text: '启用', value: 1 },
        { text: '禁用', value: 2 }
      ]" :filter-method="filterStatus" filter-placement="bottom">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="过期时间" width="180">
        <template #default="scope">
          {{ scope.row.expired_at ? formatDate(scope.row.expired_at) : '永不过期' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" type="primary" @click="viewTokenDetail(scope.row)" title="详情">
              <el-icon><Document /></el-icon>
            </el-button>
            <el-button size="small" type="primary" @click="openTokenDialog(true, scope.row)" title="编辑">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'danger' : 'success'"
              @click="toggleTokenStatus(scope.row)"
              :title="scope.row.status === 1 ? '禁用' : '启用'"
            >
              <el-icon v-if="scope.row.status === 1"><Close /></el-icon>
              <el-icon v-else><Check /></el-icon>
            </el-button>
            <el-button size="small" type="warning" @click="viewTokenDetail(scope.row)" title="配额管理">
              <el-icon><Money /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="deleteToken(scope.row)" title="删除">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
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
    <TokenFormDialog
      v-model:visible="dialogVisible"
      :token="currentToken"
      :isEdit="isEdit"
      @success="handleDialogSuccess"
    />
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
  deleteGroupToken
} from '@/api/token'
import { getGroups } from '@/api/group'
import { getAllModelConfigs } from '@/api/model'
import TokenFormDialog from './TokenFormDialog.vue'
import { Plus, Delete, Refresh, Check, Money, Download, Search, RefreshRight, Edit, Close, Document } from '@element-plus/icons-vue'

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
const tokenTable = ref(null)
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
  order: ''
})

// 当前编辑的Token
const currentToken = ref({})

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
  if (searchForm.order) params.order = searchForm.order
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

// 打开Token对话框
const openTokenDialog = (isEditMode, token = {}) => {
  isEdit.value = isEditMode
  currentToken.value = token
  dialogVisible.value = true
}

// 查看Token详情
const viewTokenDetail = (token) => {
  router.push(`/token/detail/${token.id}`)
}

// 对话框成功回调
const handleDialogSuccess = () => {
  loadTokens()
}

// 删除 Token
const deleteToken = (token) => {
  ElMessageBox.confirm(
    `确定要删除 Token "${token.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (token.group_id) {
        await deleteGroupToken(token.group_id, token.id)
      } else {
        await apiDeleteToken(token.id)
      }
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
      type: 'warning'
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

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'refresh':
      refreshTokens()
      break
    case 'exportTokens':
      exportTokens()
      break
  }
}

// 导出Token数据
const exportTokens = () => {
  ElMessage.info('导出功能开发中')
  // 实现导出功能
}

// 状态过滤方法
const filterStatus = (value, row) => {
  return row.status === value
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