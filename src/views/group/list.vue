<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>组管理</span>
          <div class="right-buttons">
            <el-button type="primary" @click="handleAdd">添加</el-button>
            <el-button type="danger" :disabled="!selectedGroups.length" @click="handleBatchDelete">批量删除</el-button>
            <el-button type="info" @click="loadGroups">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索表单 -->
      <el-form :model="searchForm" ref="searchFormRef" inline class="search-form">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="searchForm.keyword" placeholder="组名称" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 数据表格 -->
      <el-table 
        v-loading="loading" 
        :data="groups" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="rpm_limit_ratio" label="RPM限制比例" min-width="120">
          <template #default="scope">
            {{ scope.row.rpm_ratio }}%
          </template>
        </el-table-column>
        <el-table-column prop="tpm_limit_ratio" label="TPM限制比例" min-width="120">
          <template #default="scope">
            {{ scope.row.tpm_ratio }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="success" link @click="handleModelConfig(scope.row)">模型配置</el-button>
            <el-button 
              type="primary" 
              link 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              type="danger" 
              link 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGroups, updateGroupStatus, deleteGroup, deleteGroups } from '@/api/group'
import { formatDateTime } from '@/utils'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态数据
const loading = ref(false)
const groups = ref([])
const selectedGroups = ref([])

// 搜索表单
const searchFormRef = ref(null)
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 加载组列表
const loadGroups = async () => {
  if (loading.value) return // 防止重复加载
  
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    }
    
    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await getGroups(params)
    
    if (response && response.data) {
      groups.value = response.data.groups || []
      pagination.total = response.data.total || 0
    } else {
      groups.value = []
      pagination.total = 0
      console.error('返回数据格式不正确:', response)
    }
  } catch (error) {
    console.error('加载组列表失败:', error)
    ElMessage.error(`加载组列表失败: ${error.message || '请检查网络或API配置'}`)
    groups.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  loadGroups()
}

// 重置搜索
const handleReset = () => {
  searchFormRef.value?.resetFields()
  pagination.page = 1
  loadGroups()
}

// 添加组
const handleAdd = () => {
  // 跳转到添加页面
  router.push('/group/add')
}

// 编辑组
const handleEdit = (row) => {
  // 跳转到编辑页面
  router.push(`/group/edit/${row.id}`)
}

// 进入模型配置
const handleModelConfig = (row) => {
  // 跳转到模型配置页面
  router.push(`/group/model-config/${row.id}`)
}

// 删除组
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除组"${row.id}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteGroup(row.id)
      if (response && response.success) {
        ElMessage.success('删除成功')
        loadGroups()
      } else {
        const errorMsg = response?.message || '删除失败，请检查API响应'
        ElMessage.error(errorMsg)
        console.error('删除组失败:', response)
      }
    } catch (error) {
      console.error('删除组失败:', error)
      ElMessage.error('删除组失败: ' + (error.message || '请检查网络或API配置'))
    }
  }).catch(() => {
    // 取消删除
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedGroups.value.length === 0) {
    ElMessage.warning('请选择要删除的组')
    return
  }
  
  const ids = selectedGroups.value.map(item => item.id)
  ElMessageBox.confirm(`确定要删除选中的${ids.length}个组吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteGroups(ids)
      if (response && response.success) {
        ElMessage.success('批量删除成功')
        loadGroups()
      } else {
        const errorMsg = response?.message || '批量删除失败，请检查API响应'
        ElMessage.error(errorMsg)
        console.error('批量删除组失败:', response)
      }
    } catch (error) {
      console.error('批量删除组失败:', error)
      ElMessage.error('批量删除组失败: ' + (error.message || '请检查网络或API配置'))
    }
  }).catch(() => {
    // 取消删除
  })
}

// 切换组状态
const handleToggleStatus = (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  ElMessageBox.confirm(`确定要${statusText}组"${row.id}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await updateGroupStatus(row.id, newStatus)
      if (response && response.success) {
        ElMessage.success(`${statusText}成功`)
        loadGroups()
      } else {
        const errorMsg = response?.message || `${statusText}失败，请检查API响应`
        ElMessage.error(errorMsg)
        console.error(`${statusText}组失败:`, response)
      }
    } catch (error) {
      console.error(`${statusText}组失败:`, error)
      ElMessage.error(`${statusText}组失败: ` + (error.message || '请检查网络或API配置'))
    }
  }).catch(() => {
    // 取消操作
  })
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedGroups.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  loadGroups()
}

// 当前页变化
const handleCurrentChange = (page) => {
  pagination.page = page
  loadGroups()
}

// 格式化日期
const formatDate = (dateStr) => {
  return formatDateTime(dateStr)
}

// 页面加载时获取数据
onMounted(() => {
  // 确保页面加载时立即获取数据
  loadGroups()
})

// 当页面从缓存中被激活时也重新加载数据
onActivated(() => {
  loadGroups()
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.right-buttons {
  display: flex;
  gap: 10px;
}
</style> 