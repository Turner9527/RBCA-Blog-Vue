<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import interactionRequest from '@/utils/interactionRequest'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const article = ref(null)

const likeCount = ref(0)
const liked = ref(false)

const comments = ref([])
const commentTotal = ref(0)
const commentQuery = ref({ pageNum: 1, pageSize: 10 })
const commentContent = ref('')

async function load() {
  const res = await request.get('/public/article/' + route.params.id)
  if (res.code === 200) {
    article.value = res.data
  }
}

async function loadLike() {
  const id = route.params.id
  const countRes = await interactionRequest.get('/like/count', { params: { targetType: 'ARTICLE', targetId: id } })
  if (countRes.code === 200) likeCount.value = countRes.data

  if (localStorage.getItem('token')) {
    const statusRes = await interactionRequest.get('/like/status', { params: { targetType: 'ARTICLE', targetId: id } })
    if (statusRes.code === 200) liked.value = statusRes.data
  }
}

async function toggleLike() {
  if (!localStorage.getItem('token')) {
    router.push('/login')
    return
  }
  const res = await interactionRequest.post('/like/toggle', { targetType: 'ARTICLE', targetId: route.params.id })
  if (res.code === 200) {
    liked.value = res.data.liked
    likeCount.value = res.data.count
  } else {
    ElMessage.error(res.msg || '操作失败')
  }
}

async function loadComments() {
  const res = await interactionRequest.get('/comment/list', { params: { articleId: route.params.id, ...commentQuery.value } })
  if (res.code === 200) {
    comments.value = res.data.records
    commentTotal.value = res.data.total
  }
}

async function submitComment() {
  if (!localStorage.getItem('token')) {
    router.push('/login')
    return
  }
  if (!commentContent.value) {
    ElMessage.warning('请输入评论内容')
    return
  }
  const res = await interactionRequest.post('/comment', { articleId: route.params.id, content: commentContent.value })
  if (res.code === 200) {
    ElMessage.success('评论成功')
    commentContent.value = ''
    loadComments()
  } else {
    ElMessage.error(res.msg || '评论失败')
  }
}

async function toggleCommentLike(item) {
  if (!localStorage.getItem('token')) {
    router.push('/login')
    return
  }
  const res = await interactionRequest.post('/like/toggle', { targetType: 'COMMENT', targetId: item.id })
  if (res.code === 200) {
    item.liked = res.data.liked
    item.likeCount = res.data.count
  } else {
    ElMessage.error(res.msg || '操作失败')
  }
}

function goProfile() {
  if (article.value) router.push('/blog/user/' + article.value.authorId)
}

onMounted(() => {
  load()
  loadLike()
  loadComments()
})
</script>

<template>
  <div class="detail-wrap">
    <el-button link @click="router.push('/blog')">返回列表</el-button>

    <el-card v-if="article">
      <h1>{{ article.title }}</h1>
      <div class="meta">
        <UserAvatar :name="article.authorName" :avatar="article.authorAvatar" :size="28" />
        <a class="author" @click="goProfile">{{ article.authorName }}</a>
        <span>· {{ article.auditTime || article.createTime }}</span>
      </div>
      <el-divider />
      <div class="content" v-html="article.contentHtml"></div>

      <div class="like-bar">
        <el-button :type="liked ? 'primary' : 'default'" @click="toggleLike">
          {{ liked ? '已点赞' : '点赞' }} {{ likeCount }}
        </el-button>
      </div>
    </el-card>

    <el-card class="comment-card">
      <template #header>
        <span>评论（{{ commentTotal }}）</span>
      </template>

      <div class="comment-input">
        <el-input v-model="commentContent" type="textarea" :rows="3" placeholder="写下你的评论..." />
        <el-button type="primary" @click="submitComment">发表评论</el-button>
      </div>

      <div v-for="item in comments" :key="item.id" class="comment-item">
        <UserAvatar :name="item.nickname" :avatar="item.avatar" :size="32" />
        <div class="comment-body">
          <div class="comment-head">
            <span class="comment-nick">{{ item.nickname }}</span>
            <span class="comment-time">{{ item.createTime }}</span>
          </div>
          <div class="comment-content">{{ item.content }}</div>
          <el-button link :type="item.liked ? 'primary' : 'default'" @click="toggleCommentLike(item)">
            {{ item.liked ? '已赞' : '赞' }} {{ item.likeCount }}
          </el-button>
        </div>
      </div>
      <el-empty v-if="!comments.length" description="还没有评论" />
    </el-card>
  </div>
</template>

<style scoped>
.detail-wrap { max-width: 760px; margin: 0 auto; padding: 20px; }
.meta { color: #909399; font-size: 13px; margin: 8px 0; display: flex; align-items: center; gap: 6px; }
.author { color: #409eff; text-decoration: none; }
.content { white-space: pre-wrap; line-height: 1.8; }
.like-bar { margin-top: 16px; }
.comment-card { margin-top: 16px; }
.comment-input { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.comment-item { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.comment-body { flex: 1; }
.comment-head { display: flex; gap: 8px; align-items: baseline; }
.comment-nick { font-weight: 600; font-size: 14px; }
.comment-time { color: #909399; font-size: 12px; }
.comment-content { margin: 6px 0; line-height: 1.6; }
</style>
