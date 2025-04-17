<template>
  <div v-if="!item.meta || !item.meta.hidden">
    <!-- 当前菜单项没有子项 -->
    <template v-if="!hasOneShowingChild(item.children, item) && item.children">
      <el-sub-menu :index="resolvePath(item.path)" popper-append-to-body>
        <template #title>
          <el-icon v-if="item.meta && item.meta.icon">
            <component :is="item.meta.icon" />
          </el-icon>
          <span v-if="item.meta && item.meta.title">{{ item.meta.title }}</span>
        </template>
        
        <sidebar-item
          v-for="child in item.children"
          :key="child.path"
          :item="child"
          :base-path="resolvePath(child.path)"
        />
      </el-sub-menu>
    </template>
    
    <!-- 当前菜单项有且只有一个子项 -->
    <template v-else>
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)">
          <el-icon v-if="onlyOneChild.meta && onlyOneChild.meta.icon">
            <component :is="onlyOneChild.meta.icon" />
          </el-icon>
          <template #title>
            <span v-if="onlyOneChild.meta && onlyOneChild.meta.title">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { isExternal } from '@/utils/validate'
import AppLink from './Link.vue'
import path from 'path-browserify'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  basePath: {
    type: String,
    default: ''
  }
})

const onlyOneChild = ref(null)

// 判断是否有且只有一个可见子项
const hasOneShowingChild = (children = [], parent) => {
  if (!children) {
    children = []
  }
  
  const showingChildren = children.filter(item => {
    if (item.meta && item.meta.hidden) {
      return false
    }
    return true
  })
  
  // 当只有一个子菜单项时直接显示
  if (showingChildren.length === 1) {
    onlyOneChild.value = showingChildren[0]
    return true
  }
  
  // 没有子菜单时如果当前有设置meta，则当作只有一个子菜单处理
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '' }
    return true
  }
  
  return false
}

// 解析路径
const resolvePath = (routePath) => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }
  return path.resolve(props.basePath, routePath)
}
</script> 