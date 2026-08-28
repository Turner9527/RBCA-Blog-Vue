<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  // 只有登录用户才去拉取用户信息和菜单
  if (userStore.token) {
    await userStore.fetchUserInfo()
    await userStore.fetchMenus()
  }
})

function resolvePath(base, path) {
  if (!path) return base
  if (path.startsWith('/')) return path
  return (base ? base + '/' : '') + path
}

const menuItems = computed(() => {
  function walk(menus, base) {
    return (menus || [])
      .filter((m) => m.menuType !== 'F')
      .map((m) => {
        const full = resolvePath(base, m.path)
        return {
          index: full,
          title: m.menuName,
          icon: m.icon,
          children: m.children && m.children.length ? walk(m.children, full) : [],
        }
      })
  }
  return walk(userStore.menus, '')
})

async function handleLogout() {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/blog')
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">RBAC 管理系统</div>
      <el-menu :default-active="route.path" router background-color="#001529" text-color="#c0c4cc" active-text-color="#ffffff">
        <template v-if="userStore.token">
          <template v-for="item in menuItems" :key="item.index">
            <el-sub-menu v-if="item.children && item.children.length" :index="item.index">
              <template #title>{{ item.title }}</template>
              <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
                {{ child.title }}
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="item.index">{{ item.title }}</el-menu-item>
          </template>
          <el-menu-item index="/article/my">我的文章</el-menu-item>
          <el-menu-item v-if="userStore.roles.includes('admin')" index="/article/audit">文章审核</el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <template v-if="userStore.token">
          <span>{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
          <el-button link type="danger" @click="handleLogout">退出登录</el-button>
        </template>
        <el-button v-else link type="primary" @click="router.push('/login')">登录</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout { height: 100vh; }
.aside { background: #001529; }
.logo { height: 60px; line-height: 60px; text-align: center; color: #fff; font-weight: bold; font-size: 16px; }
.aside :deep(.el-menu) { border-right: none; }
.header { display: flex; align-items: center; justify-content: flex-end; gap: 16px; border-bottom: 1px solid #eee; background: #fff; }
.main { background: #f0f2f5; }
</style>
