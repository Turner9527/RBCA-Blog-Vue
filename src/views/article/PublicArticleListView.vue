<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import interactionRequest from '@/utils/interactionRequest'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10 })

async function load() {
  const res = await request.get('/public/article', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
    await loadLikeCounts()
  }
}

async function loadLikeCounts() {
  const ids = list.value.map((item) => item.id)
  if (!ids.length) return
  const res = await interactionRequest.get('/like/counts', { params: { targetType: 'ARTICLE', targetIds: ids.join(',') } })
  if (res.code === 200) {
    const map = res.data || {}
    list.value.forEach((item) => {
      item.likeCount = map[item.id] || 0
    })
  }
}

async function toggleLike(item) {
  if (!localStorage.getItem('token')) {
    router.push('/login')
    return
  }
  const res = await interactionRequest.post('/like/toggle', { targetType: 'ARTICLE', targetId: item.id })
  if (res.code === 200) {
    item.likeCount = res.data.count
  } else {
    ElMessage.error(res.msg || '操作失败')
  }
}

function goDetail(row) {
  router.push('/blog/articles/' + row.id)
}

function goProfile(authorId) {
  router.push('/blog/user/' + authorId)
}

function goWrite() {
  if (!localStorage.getItem('token')) {
    router.push('/login')
    return
  }
  router.push('/blog/write')
}

onMounted(load)
</script>

<template>
  <div>
    <div class="top-bar">
      <div></div>
      <el-button type="primary" @click="goWrite">发布文章</el-button>
    </div>
    <el-card v-for="item in list" :key="item.id" class="card" shadow="hover" @click="goDetail(item)">
      <div class="title">{{ item.title }}</div>
      <div class="meta">
        <UserAvatar :name="item.authorName" :avatar="item.authorAvatar" :size="22" />
        <a class="author" @click.stop="goProfile(item.authorId)">{{ item.authorName }}</a>
        <span>· {{ item.auditTime || item.createTime }}</span>
        <el-button link size="small" @click.stop="toggleLike(item)">点赞 {{ item.likeCount || 0 }}</el-button>
      </div>
    </el-card>
    <el-pagination
      class="pager"
      v-model:current-page="query.pageNum"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
      @size-change="load"
    />
  </div>
</template>

<style scoped>
.toolbar { margin-bottom: 14px; display: flex; justify-content: flex-end; }
.card { margin-bottom: 12px; cursor: pointer; }
.title { font-size: 16px; font-weight: 600; }
.meta { margin-top: 6px; color: #909399; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.author { color: #409eff; text-decoration: none; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
