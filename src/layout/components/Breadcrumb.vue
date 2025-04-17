<template>
  <el-breadcrumb class="breadcrumb" separator="/">
    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
      <router-link v-if="index < breadcrumbs.length - 1" :to="item.path">
        {{ item.meta.title }}
      </router-link>
      <span v-else>{{ item.meta.title }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const breadcrumbs = ref([])

// 监听路由变化，更新面包屑
watch(
  () => route.path,
  () => {
    // 获取与当前路由匹配的路由记录
    const matched = route.matched.filter(item => item.meta && item.meta.title)
    
    // 始终添加首页
    const first = matched[0]
    if (first && first.path !== '/dashboard') {
      matched.unshift({
        path: '/dashboard',
        meta: { title: '首页' }
      })
    }
    
    breadcrumbs.value = matched
  },
  { immediate: true }
)
</script>

<style scoped>
.breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
}
</style> 