# AIProxy 开发文档

## 项目概述

AIProxy 是一个 AI 模型代理和管理系统，包含两个主要部分：
1. 后端 API 服务（使用 Go 语言开发）
2. 前端 Web 界面（使用 Vue 3 开发）

后端提供了 API 代理、模型管理、渠道管理、用户组管理、监控和日志等功能。前端提供了用户友好的界面来管理和监控系统。

## 后端 API 结构

### 核心模块

后端代码位于 `aiproxy` 目录下，主要模块包括：

1. **控制器 (Controller)**：处理 API 请求的业务逻辑
   - `model.go`: 模型相关接口
   - `modelconfig.go`: 模型配置接口
   - `channel.go`: 渠道管理接口
   - `channel-test.go`: 渠道测试接口
   - `channel-billing.go`: 渠道计费接口
   - `group.go`: 用户组管理接口
   - `log.go`: 日志查询接口
   - `dashboard.go`: 仪表盘数据接口
   - `monitor.go`: 监控接口
   - `token.go`: 令牌管理接口
   - `relay.go`: 中继代理接口

2. **路由 (Router)**：定义 API 路由
   - `api.go`: API 路由定义
   - `relay.go`: 中继路由定义

3. **模型 (Model)**：数据模型定义

4. **中继 (Relay)**：代理请求到不同的模型提供商

### 主要 API 端点

根据 `router/api.go` 文件，后端提供以下主要 API 端点：

#### 模型相关 API
- `/api/models/builtin`: 获取内置模型列表
- `/api/models/enabled`: 获取启用的模型
- `/api/models/default`: 获取渠道默认模型和映射

#### 模型配置 API
- `/api/model_configs`: 获取/保存模型配置
- `/api/model_config`: 单个模型配置操作

#### 渠道管理 API
- `/api/channels`: 渠道列表管理
  - `GET`: 获取渠道列表，支持分页和筛选
  - `POST`: 批量添加渠道
- `/api/channels/all`: 获取所有渠道（不分页）
- `/api/channels/type_names`: 获取渠道类型名称
- `/api/channels/type_metas`: 获取渠道类型元数据
- `/api/channels/search`: 搜索渠道
- `/api/channels/batch_delete`: 批量删除渠道
- `/api/channels/test`: 测试所有启用的渠道
- `/api/channels/update_balance`: 更新所有启用渠道的余额

- `/api/channel`: 单个渠道操作
  - `POST`: 添加单个渠道
- `/api/channel/:id`: 单个渠道管理
  - `GET`: 获取渠道详情
  - `PUT`: 更新渠道信息
  - `DELETE`: 删除渠道
- `/api/channel/:id/status`: 更新渠道状态
- `/api/channel/:id/test`: 测试渠道所有模型
- `/api/channel/:id/test/:model`: 测试渠道特定模型
- `/api/channel/:id/balance`: 更新渠道余额

#### 用户组管理 API
- `/api/groups`: 用户组列表管理
- `/api/group`: 单个用户组操作
- `/api/group/:group/model_config`: 用户组模型配置

#### 令牌管理 API
- `/api/tokens`: 令牌列表管理
- `/api/token`: 单个令牌操作

#### 日志查询 API
- `/api/logs`: 日志查询
- `/api/log`: 用户组日志查询

#### 监控 API
- `/api/monitor`: 监控数据
- `/api/monitor/:id`: 单个渠道监控数据

#### 仪表盘 API
- `/api/dashboard`: 获取仪表盘数据
- `/api/dashboard/:group`: 获取用户组仪表盘数据

## 前端结构

前端代码位于 `src` 目录下，主要包括：

### 组件结构
- `src/views`: 页面视图组件
  - `dashboard/`: 仪表盘页面
  - `model/`: 模型管理页面
  - `channel/`: 渠道管理页面
  - `group/`: 用户组管理页面
  - `log/`: 日志查询页面
  - `monitor/`: 监控页面
  - `login/`: 登录页面

### API 请求结构
- `src/api`: API 请求模块
  - `model.js`: 模型相关 API
  - `channel.js`: 渠道相关 API
  - `group.js`: 用户组相关 API
  - `log.js`: 日志相关 API
  - `dashboard.js`: 仪表盘相关 API

## 开发指南

### 后端 API 开发步骤

1. 在 `aiproxy/controller` 目录下实现相应的控制器方法
2. 在 `aiproxy/router/api.go` 中添加相应的路由
3. 在 `aiproxy/model` 目录下添加需要的数据模型

### 前端页面开发步骤

1. 在 `src/api` 目录下添加对应的 API 请求方法
2. 在 `src/views` 目录下创建对应的页面视图组件
3. 在 `src/router` 目录下添加相应的路由配置
4. 需要时在 `src/stores` 目录下添加状态管理

## 功能开发清单

### 模型管理功能
- [ ] 模型列表展示
- [ ] 模型配置添加/编辑/删除
- [ ] 模型启用/禁用

### 渠道管理功能
- [x] 渠道列表展示
  - 支持分页和筛选
  - 显示渠道类型、状态和余额
  - 操作按钮：编辑、删除、测试、状态切换
- [x] 渠道添加/编辑表单
  - 基础信息：名称、类型、密钥、基础URL
  - 模型配置：支持的模型和模型映射
  - 高级配置：根据渠道类型显示不同字段
- [x] 渠道测试功能
  - 测试单个渠道
  - 测试所有渠道
  - 显示测试结果详情
- [x] 渠道余额查询
  - 更新单个渠道余额
  - 更新所有渠道余额

### 用户组管理功能
- [ ] 用户组列表展示
- [ ] 用户组添加/编辑/删除
- [ ] 用户组模型配置
- [ ] 用户组令牌管理

### 监控功能
- [ ] 错误率监控
- [ ] 模型使用统计
- [ ] 渠道状态监控

### 日志功能
- [ ] 日志查询
- [ ] 日志详情查看
- [ ] 日志统计分析

## 开发样例

### 添加新 API 端点

1. 在 `aiproxy/controller` 中添加控制器方法：

```go
// NewMethod godoc
//
// @Summary    New API method
// @Description Description for the new API method
// @Tags        example
// @Produce    json
// @Security    ApiKeyAuth
// @Success    200 {object} middleware.APIResponse{data=YourResponseType}
// @Router     /api/example/new [get]
func NewMethod(c *gin.Context) {
    // Implementation
    middleware.SuccessResponse(c, data)
}
```

2. 在 `aiproxy/router/api.go` 中添加路由：

```go
exampleRoute := apiRouter.Group("/example")
{
    exampleRoute.GET("/new", controller.NewMethod)
}
```

### 添加前端 API 请求

在 `src/api/example.js` 中添加：

```javascript
import request from '@/utils/request'

export function callNewMethod(params) {
  return request({
    url: '/api/example/new',
    method: 'get',
    params
  })
}
```

### 添加前端页面组件

在 `src/views/example/NewPage.vue` 中创建页面组件。

## 开发 PROMPT 示例

在开发过程中，可以使用以下 PROMPT 来指导开发工作。这些 PROMPT 基于后端 API 结构，帮助快速实现前端功能。

### 模型管理功能开发 PROMPT

```
分析 AIProxy 后端的模型管理 API，并实现前端模型管理页面：

1. 后端模型 API 分析：
   - GET /api/model_configs：获取模型配置列表
   - POST /api/model_config：添加模型配置
   - PUT /api/model_config/:model：更新模型配置
   - DELETE /api/model_config/:model：删除模型配置
   - GET /api/models/builtin：获取内置模型列表
   - GET /api/models/enabled：获取已启用模型列表

2. 实现模型管理前端功能：
   - 模型列表展示，支持分页和搜索
   - 模型配置添加/编辑表单
   - 模型启用/禁用功能
   - 模型删除功能
   - 显示模型详细信息

3. 提供 Vue 组件实现：
   - 使用 Element Plus 组件库的表格、表单等组件
   - 实现数据获取、状态管理和提交逻辑
   - 处理错误情况和加载状态
```

### 渠道管理功能开发 PROMPT

```
分析 AIProxy 后端的渠道管理 API，并实现前端渠道管理页面：

1. 后端渠道 API 分析：
   - GET /api/channels：获取渠道列表，支持分页
   - GET /api/channels/all：获取所有渠道（不分页）
   - POST /api/channel：添加渠道
   - POST /api/channels：批量添加渠道
   - PUT /api/channel/:id：更新渠道信息
   - DELETE /api/channel/:id：删除渠道
   - POST /api/channels/batch_delete：批量删除渠道
   - GET /api/channels/type_names：获取渠道类型名称
   - GET /api/channels/type_metas：获取渠道类型元数据
   - GET /api/channels/search：搜索渠道
   - GET /api/channel/:id/test：测试渠道所有模型
   - GET /api/channel/:id/test/:model：测试渠道特定模型
   - GET /api/channels/test：测试所有启用的渠道
   - GET /api/channel/:id/balance：更新渠道余额
   - GET /api/channels/update_balance：更新所有渠道余额
   - POST /api/channel/:id/status：更新渠道状态

2. 实现渠道管理前端功能：
   - 渠道列表展示，支持分页和搜索
   - 渠道添加/编辑表单，根据渠道类型动态显示不同字段
   - 渠道测试功能和测试结果展示
   - 渠道余额查询和刷新功能
   - 渠道状态切换功能
   - 批量删除渠道功能

3. 提供 Vue 组件实现：
   - 渠道列表组件：显示渠道信息和操作按钮
   - 渠道表单对话框组件：添加和编辑渠道
   - 渠道测试结果组件：显示测试详情和响应内容
```

### 用户组管理功能开发 PROMPT

```
分析 AIProxy 后端的用户组管理 API，并实现前端用户组管理页面：

1. 后端用户组 API 分析：
   - GET /api/groups：获取用户组列表
   - POST /api/group/:group：创建用户组
   - PUT /api/group/:group：更新用户组
   - DELETE /api/group/:group：删除用户组
   - GET /api/group/:group/model_config：获取用户组模型配置
   - POST /api/group/:group/model_config：保存用户组模型配置

2. 实现用户组管理前端功能：
   - 用户组列表展示
   - 用户组创建/编辑表单
   - 用户组模型配置设置
   - 用户组令牌管理
   - 用户组使用统计展示

3. 提供 Vue 组件实现：
   - 用户组管理主页面
   - 用户组详情页面
   - 用户组模型配置组件
   - 用户组令牌管理组件
```

### 监控功能开发 PROMPT

```
分析 AIProxy 后端的监控 API，并实现前端监控页面：

1. 后端监控 API 分析：
   - GET /api/monitor：获取所有渠道模型错误率
   - GET /api/monitor/:id：获取特定渠道模型错误率
   - GET /api/monitor/models：获取模型错误率
   - GET /api/monitor/banned_channels：获取所有被禁用的模型渠道

2. 实现监控功能前端页面：
   - 错误率监控面板，支持按渠道和模型筛选
   - 错误率趋势图表展示
   - 渠道状态监控，包括被禁用渠道展示
   - 监控数据导出功能

3. 提供 Vue 组件实现：
   - 使用 ECharts 实现错误率图表
   - 监控面板组件
   - 渠道状态列表组件
```

### 日志查询功能开发 PROMPT

```
分析 AIProxy 后端的日志查询 API，并实现前端日志查询页面：

1. 后端日志 API 分析：
   - GET /api/logs：获取所有日志
   - GET /api/logs/search：搜索日志
   - GET /api/logs/detail/:log_id：获取日志详情
   - GET /api/logs/used/models：获取已使用的模型列表
   - GET /api/log/:group：获取特定用户组的日志

2. 实现日志查询前端功能：
   - 日志列表展示，支持分页、筛选和搜索
   - 日志详情展示，包括请求和响应内容
   - 日志统计分析，按模型、用户组等维度
   - 日志导出功能

3. 提供 Vue 组件实现：
   - 日志列表组件
   - 日志详情对话框组件
   - 日志统计图表组件
   - 日志搜索筛选组件
```

## 示例实现

### 渠道列表组件示例 (Vue 3 + Element Plus)

```vue
<template>
  <div class="channel-list">
    <div class="header">
      <el-button type="primary" @click="handleAdd">添加渠道</el-button>
      <el-button @click="handleTestAll">测试所有渠道</el-button>
      <el-button @click="handleUpdateAllBalance">更新所有余额</el-button>
    </div>
    
    <el-table 
      v-loading="loading" 
      :data="channelList" 
      border 
      style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="类型">
        <template #default="scope">
          {{ getChannelTypeName(scope.row.type) }}
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <el-switch 
            v-model="scope.row.status" 
            @change="handleStatusChange(scope.row)"
            :active-value="1"
            :inactive-value="0"
          />
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" />
      <el-table-column label="操作" width="300">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="success" @click="handleTest(scope.row)">测试</el-button>
          <el-button size="small" type="primary" @click="handleUpdateBalance(scope.row)">更新余额</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-if="total > 0"
      layout="total, sizes, prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 渠道表单对话框 -->
    <channel-form-dialog
      v-model:visible="dialogVisible"
      :channel="currentChannel"
      :is-edit="isEdit"
      @success="fetchChannels"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChannelFormDialog from './ChannelFormDialog.vue'
import { 
  getChannels, 
  deleteChannel, 
  updateChannelStatus,
  testChannel,
  testAllChannels,
  updateChannelBalance,
  updateAllChannelsBalance
} from '@/api/channel'
import { getChannelTypeNames } from '@/api/channel'

const channelList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const currentChannel = ref(null)
const isEdit = ref(false)
const channelTypeNames = ref({})

onMounted(async () => {
  await fetchChannelTypeNames()
  fetchChannels()
})

const fetchChannelTypeNames = async () => {
  try {
    const res = await getChannelTypeNames()
    if (res.code === 0) {
      channelTypeNames.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const getChannelTypeName = (type) => {
  return channelTypeNames.value[type] || type
}

const fetchChannels = async () => {
  loading.value = true
  try {
    const res = await getChannels({
      page: currentPage.value,
      per_page: pageSize.value
    })
    if (res.code === 0) {
      channelList.value = res.data.channels
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取渠道列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  currentChannel.value = {}
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  currentChannel.value = { ...row }
  isEdit.value = true
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除渠道 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteChannel(row.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchChannels()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleStatusChange = async (row) => {
  try {
    const res = await updateChannelStatus(row.id, { status: row.status })
    if (res.code === 0) {
      ElMessage.success(`${row.status === 1 ? '启用' : '禁用'}成功`)
    } else {
      ElMessage.error(res.message || '操作失败')
      // 回滚状态
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('操作失败')
    // 回滚状态
    row.status = row.status === 1 ? 0 : 1
  }
}

const handleTest = async (row) => {
  try {
    ElMessage.info(`正在测试渠道 "${row.name}"...`)
    const res = await testChannel(row.id)
    if (res.code === 0) {
      ElMessage.success(`渠道 "${row.name}" 测试成功`)
    } else {
      ElMessage.error(res.message || `渠道 "${row.name}" 测试失败`)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(`渠道 "${row.name}" 测试失败`)
  }
}

const handleTestAll = async () => {
  try {
    ElMessage.info('正在测试所有渠道...')
    const res = await testAllChannels()
    if (res.code === 0) {
      ElMessage.success('所有渠道测试完成')
    } else {
      ElMessage.error(res.message || '测试失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('测试失败')
  }
}

const handleUpdateBalance = async (row) => {
  try {
    ElMessage.info(`正在更新渠道 "${row.name}" 余额...`)
    const res = await updateChannelBalance(row.id)
    if (res.code === 0) {
      ElMessage.success(`渠道 "${row.name}" 余额已更新`)
      fetchChannels() // 刷新列表获取新的余额
    } else {
      ElMessage.error(res.message || `更新渠道 "${row.name}" 余额失败`)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(`更新渠道 "${row.name}" 余额失败`)
  }
}

const handleUpdateAllBalance = async () => {
  try {
    ElMessage.info('正在更新所有渠道余额...')
    const res = await updateAllChannelsBalance()
    if (res.code === 0) {
      ElMessage.success('所有渠道余额已更新')
      fetchChannels() // 刷新列表获取新的余额
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('更新失败')
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  fetchChannels()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchChannels()
}
</script>

<style scoped>
.channel-list {
  padding: 20px;
}
.header {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
```

### 渠道表单组件示例

```vue
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
          <span class="model-name">{{ model }}</span>
          <el-input
            v-model="form.model_mapping[model]"
            placeholder="映射到的实际模型名称"
            style="width: 300px; margin-left: 10px;"
          />
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
```

上述 PROMPT 和组件示例可以帮助开发者更高效地基于后端 API 结构实现前端功能。 