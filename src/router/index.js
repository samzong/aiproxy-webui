import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      }
    ]
  },
  {
    path: '/channel',
    component: () => import('@/layout/index.vue'),
    redirect: '/channel/list',
    meta: { title: '渠道管理', icon: 'Connection' },
    children: [
      {
        path: 'list',
        name: 'ChannelList',
        component: () => import('@/views/channel/list.vue'),
        meta: { title: '渠道列表', icon: 'List' }
      },
      {
        path: 'add',
        name: 'ChannelAdd',
        component: () => import('@/views/channel/add.vue'),
        meta: { title: '添加渠道', icon: 'Plus' }
      }
    ]
  },
  {
    path: '/token',
    component: () => import('@/layout/index.vue'),
    redirect: '/token/list',
    meta: { title: 'Token 管理', icon: 'Key' },
    children: [
      {
        path: 'list',
        name: 'TokenList',
        component: () => import('@/views/token/list.vue'),
        meta: { title: 'Token 列表', icon: 'List' }
      },
      {
        path: 'add',
        name: 'TokenAdd',
        component: () => import('@/views/token/add.vue'),
        meta: { title: '添加Token', icon: 'Plus' }
      },
      {
        path: 'detail/:id',
        name: 'TokenDetail',
        component: () => import('@/views/token/detail.vue'),
        meta: { title: 'Token详情', icon: 'Document', hidden: true }
      }
    ]
  },
  {
    path: '/group',
    component: () => import('@/layout/index.vue'),
    redirect: '/group/list',
    meta: { title: '组管理', icon: 'UserFilled' },
    children: [
      {
        path: 'list',
        name: 'GroupList',
        component: () => import('@/views/group/list.vue'),
        meta: { title: '组列表', icon: 'List' }
      },
      {
        path: 'add',
        name: 'GroupAdd',
        component: () => import('@/views/group/add.vue'),
        meta: { title: '添加组', icon: 'Plus' }
      },
      {
        path: 'edit/:id',
        name: 'GroupEdit',
        component: () => import('@/views/group/add.vue'),
        meta: { title: '编辑组', icon: 'Edit', hidden: true }
      },
      {
        path: 'model-config/:id',
        name: 'GroupModelConfig',
        component: () => import('@/views/group/model-config.vue'),
        meta: { title: '模型配置', icon: 'Setting', hidden: true }
      }
    ]
  },
  {
    path: '/model',
    component: () => import('@/layout/index.vue'),
    redirect: '/model/list',
    meta: { title: '模型管理', icon: 'Cpu' },
    children: [
      {
        path: 'list',
        name: 'ModelList',
        component: () => import('@/views/model/list.vue'),
        meta: { title: '模型列表', icon: 'List' }
      },
      {
        path: 'config',
        name: 'ModelConfig',
        component: () => import('@/views/model/config.vue'),
        meta: { title: '添加模型', icon: 'Setting' }
      }
    ]
  },
  {
    path: '/log',
    component: () => import('@/layout/index.vue'),
    redirect: '/log/list',
    meta: { title: '日志管理', icon: 'Document' },
    children: [
      {
        path: 'list',
        name: 'LogList',
        component: () => import('@/views/log/list.vue'),
        meta: { title: '日志列表', icon: 'List' }
      },
      {
        path: 'detail/:id',
        name: 'LogDetail',
        component: () => import('@/views/log/detail.vue'),
        meta: { title: '日志详情', icon: 'Document', hidden: true }
      }
    ]
  },
  {
    path: '/monitor',
    component: () => import('@/layout/index.vue'),
    redirect: '/monitor/error',
    meta: { title: '监控管理', icon: 'Warning' },
    children: [
      {
        path: 'error',
        name: 'ErrorMonitor',
        component: () => import('@/views/monitor/error.vue'),
        meta: { title: '错误监控', icon: 'CircleClose' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - AI Proxy 管理平台` : 'AI Proxy 管理平台'
  
  const userStore = useUserStore()
  const adminKey = userStore.adminKey
  
  if (to.path === '/login') {
    next()
    return
  }
  
  if (!adminKey) {
    next('/login')
    return
  }
  
  next()
})

export default router 