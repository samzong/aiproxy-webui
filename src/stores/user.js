import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    adminKey: Cookies.get('adminKey') || '',
    loginStatus: false
  }),
  
  actions: {
    // 登录方法
    async login(adminKey) {
      try {
        // 设置请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${adminKey}`
        
        // 测试是否能访问API
        const response = await axios.get('/api/status')
        
        if (response.status === 200) {
          // 登录成功，保存adminKey
          this.adminKey = adminKey
          this.loginStatus = true
          
          // 存入Cookie，7天有效期
          Cookies.set('adminKey', adminKey, { expires: 7 })
          
          return true
        }
        return false
      } catch (error) {
        console.error('登录失败:', error)
        return false
      }
    },
    
    // 登出方法
    logout() {
      this.adminKey = ''
      this.loginStatus = false
      Cookies.remove('adminKey')
      delete axios.defaults.headers.common['Authorization']
    },
    
    // 初始化方法，从Cookie中恢复登录状态
    initAuth() {
      const storedKey = Cookies.get('adminKey')
      if (storedKey) {
        this.adminKey = storedKey
        this.loginStatus = true
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedKey}`
      }
    }
  }
}) 