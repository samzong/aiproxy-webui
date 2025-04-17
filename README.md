# AI Proxy 管理界面

这是一个基于Vue 3和Element Plus的管理界面，用于管理和监控AI Proxy服务。

## 功能特性

- 使用Admin Key进行登录认证
- 仪表盘数据可视化
- 渠道管理
- 组管理
- 模型配置
- 日志查看
- 监控管理

## 快速开始

### 安装依赖

```bash
cd webui
npm install
```

### 开发模式运行

```bash
npm run serve
```

### 生产环境构建

```bash
npm run build
```

## 配置说明

默认情况下，开发服务器会代理以下请求到后端服务器：

- `/api/*` - 管理API
- `/v1/*` - 中继API

如需修改后端服务器地址，请编辑`vue.config.js`文件中的代理配置。

## 目录结构

```
webui/
├── public/            # 静态资源
├── src/               # 源代码
│   ├── api/           # API调用
│   ├── assets/        # 项目资源
│   ├── components/    # 公共组件
│   ├── layout/        # 布局组件
│   ├── router/        # 路由配置
│   ├── stores/        # 状态管理
│   ├── utils/         # 工具函数
│   ├── views/         # 页面视图
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── .eslintrc.js       # ESLint配置
├── babel.config.js    # Babel配置
├── package.json       # 项目依赖
└── vue.config.js      # Vue配置
```

## 使用方法

1. 启动后端AI Proxy服务
2. 运行前端管理界面
3. 使用Admin Key登录（与后端配置的`ADMIN_KEY`一致）
4. 开始管理和监控AI Proxy服务

## 许可证

与AI Proxy项目相同