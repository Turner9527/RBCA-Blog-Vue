<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  if (userStore.token) {
    await userStore.fetchUserInfo()
  }
})

function goProfile() {
  if (userStore.userInfo?.id) {
    router.push('/blog/user/' + userStore.userInfo.id)
  }
}

function handleCommand(cmd) {
  if (cmd === 'profile') goProfile()
  if (cmd === 'logout') handleLogout()
}

async function handleLogout() {
  await userStore.logout()
  router.push('/blog')
}
</script>

<template>
  <el-container class="blog-layout">
    <el-header class="blog-header">
      <div class="blog-brand" @click="router.push('/blog')">SuperQinzi</div>
      <div class="blog-nav">
        <el-button link @click="router.push('/blog')">首页</el-button>
        <template v-if="userStore.token">
          <el-dropdown @command="handleCommand">
            <span class="nick-trigger">
              <UserAvatar :name="userStore.userInfo?.nickname || userStore.userInfo?.username" :avatar="userStore.userInfo?.avatar" :size="32" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <el-button v-else type="primary" @click="router.push('/login')">登录</el-button>
      </div>
    </el-header>
    <el-main class="blog-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.blog-layout { min-height: 100vh; background: #f5f6f7; }
.blog-header { display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #fff; border-bottom: 1px solid #eee; }
.blog-brand { font-size: 20px; font-weight: bold; cursor: pointer; }
.blog-nav { display: flex; align-items: center; gap: 8px; }
.nick-trigger { cursor: pointer; display: inline-flex; align-items: center; }
.blog-main { max-width: 860px; width: 100%; margin: 0 auto; padding: 20px; }
</style>
