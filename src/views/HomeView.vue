<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div>
    <el-card>
      <h1>首页</h1>
      <p>欢迎你，{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '访客' }}</p>
    </el-card>
  </div>
</template>
