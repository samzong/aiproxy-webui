import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 创建axios实例
const service = axios.create({
  timeout: 30000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.adminKey) {
      config.headers['Authorization'] = `Bearer ${userStore.adminKey}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 这里根据API的返回格式进行处理
    if (response.status !== 200) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 5000
      })
      return Promise.reject(new Error(res.message || '请求失败'))
    } else {
      // API成功返回
      if (res.code && res.code !== 0) {
        ElMessage({
          message: res.message || '操作失败',
          type: 'error',
          duration: 5000
        })
        
        // 如果是未授权，尝试登出
        if (res.code === 401) {
          const userStore = useUserStore()
          userStore.logout()
        }
        
        return Promise.reject(new Error(res.message || '操作失败'))
      }
      return res
    }
  },
  error => {
    console.error('响应错误:', error)
    
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      ElMessage({
        message: '身份验证失败，请重新登录',
        type: 'error',
        duration: 5000
      })
    } else {
      ElMessage({
        message: error.message || '网络错误',
        type: 'error',
        duration: 5000
      })
    }
    
    return Promise.reject(error)
  }
)

export default service 