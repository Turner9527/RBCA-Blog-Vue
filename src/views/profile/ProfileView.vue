<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const profile = ref(null)
const approvedArticles = ref([])
const myArticles = ref([])
const editMode = ref(false)
const form = reactive({ bio: '', githubUrl: '', bilibiliUrl: '' })
const fileInput = ref(null)

const isSelf = computed(() => {
  return profile.value && userStore.userInfo && profile.value.id === userStore.userInfo.id
})

const statusText = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '未通过' }
const statusType = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

async function loadProfile() {
  const res = await request.get('/public/profile/' + route.params.id)
  if (res.code === 200) {
    profile.value = res.data.userInfo
    approvedArticles.value = res.data.articles || []
    form.bio = profile.value.bio || ''
    form.githubUrl = profile.value.githubUrl || ''
    form.bilibiliUrl = profile.value.bilibiliUrl || ''
  } else {
    ElMessage.error(res.msg || '加载失败')
  }
}

async function loadMyArticles() {
  const res = await request.get('/article/my', { params: { pageNum: 1, pageSize: 100 } })
  if (res.code === 200) {
    myArticles.value = res.data.records
  }
}

function startEdit() {
  form.bio = profile.value.bio || ''
  form.githubUrl = profile.value.githubUrl || ''
  form.bilibiliUrl = profile.value.bilibiliUrl || ''
  editMode.value = true
}

async function saveProfile() {
  const res = await request.put('/user/profile', form)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    editMode.value = false
    await loadProfile()
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

function chooseAvatar() {
  fileInput.value.click()
}

async function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  const res = await request.post('/user/avatar', fd)
  if (res.code === 200) {
    ElMessage.success('头像已更新')
    profile.value.avatar = res.data
    if (userStore.userInfo) {
      userStore.userInfo.avatar = res.data
    }
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
  e.target.value = ''
}

function goArticle(id) {
  router.push('/blog/articles/' + id)
}

onMounted(async () => {
  if (userStore.token && !userStore.userInfo) {
    await userStore.fetchUserInfo()
  }
  await loadProfile()
  if (isSelf.value) {
    await loadMyArticles()
  }
})
</script>

<template>
  <div v-if="profile">
    <el-card class="profile-card">
      <div class="profile-head">
        <div class="left">
          <UserAvatar :name="profile.nickname || profile.username" :avatar="profile.avatar" :size="64" />
          <div class="info">
            <div class="nickname">{{ profile.nickname || profile.username }}</div>
            <div class="reg-time">注册时间：{{ profile.createTime }}</div>
          </div>
        </div>
        <div class="actions">
          <el-button v-if="isSelf" @click="chooseAvatar">更换头像</el-button>
          <el-button v-if="isSelf && !editMode" type="primary" @click="startEdit">编辑资料</el-button>
        </div>
        <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onAvatarChange" />
      </div>

      <template v-if="editMode">
        <el-form :model="form" label-width="90px" class="edit-form">
          <el-form-item label="个人简介">
            <el-input v-model="form.bio" type="textarea" :rows="3" placeholder="介绍一下自己" />
          </el-form-item>
          <el-form-item label="GitHub">
            <el-input v-model="form.githubUrl" placeholder="https://github.com/xxx" />
          </el-form-item>
          <el-form-item label="Bilibili">
            <el-input v-model="form.bilibiliUrl" placeholder="https://space.bilibili.com/xxx" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveProfile">保存</el-button>
            <el-button @click="editMode = false">取消</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template v-else>
        <p class="bio">{{ profile.bio || '这个人很懒，还没有写简介' }}</p>
        <div class="links">
          <a v-if="profile.githubUrl" :href="profile.githubUrl" target="_blank" rel="noopener">GitHub</a>
          <a v-if="profile.bilibiliUrl" :href="profile.bilibiliUrl" target="_blank" rel="noopener">Bilibili</a>
        </div>
      </template>
    </el-card>

    <el-card class="articles-card">
      <template #header>
        <span>{{ isSelf ? '我的文章' : 'TA 的文章' }}</span>
      </template>

      <div v-if="isSelf" class="article-list">
        <div v-for="item in myArticles" :key="item.id" class="article-item">
          <div class="article-title" @click="item.status === 'APPROVED' && goArticle(item.id)">
            {{ item.title }}
          </div>
          <el-tag :type="statusType[item.status]" size="small">{{ statusText[item.status] }}</el-tag>
          <div v-if="item.auditComment" class="audit-comment">审核意见：{{ item.auditComment }}</div>
        </div>
        <el-empty v-if="!myArticles.length" description="还没有文章" />
      </div>

      <div v-else class="article-list">
        <div v-for="item in approvedArticles" :key="item.id" class="article-item clickable" @click="goArticle(item.id)">
          <div class="article-title">{{ item.title }}</div>
          <div class="article-time">{{ item.auditTime || item.createTime }}</div>
        </div>
        <el-empty v-if="!approvedArticles.length" description="TA 还没有公开文章" />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.profile-card { margin-bottom: 16px; }
.profile-head { display: flex; justify-content: space-between; align-items: center; }
.left { display: flex; align-items: center; gap: 14px; }
.info .nickname { font-size: 22px; font-weight: bold; }
.reg-time { color: #909399; font-size: 13px; margin-top: 6px; }
.actions { display: flex; gap: 8px; }
.bio { color: #303133; line-height: 1.7; margin: 12px 0; }
.links { display: flex; gap: 12px; margin-top: 8px; }
.links a { color: #409eff; text-decoration: none; }
.edit-form { margin-top: 16px; }
.article-item { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.article-title { font-size: 15px; font-weight: 500; }
.clickable { cursor: pointer; }
.clickable .article-title:hover { color: #409eff; }
.article-time { color: #909399; font-size: 12px; margin-top: 4px; }
.audit-comment { color: #909399; font-size: 12px; margin-top: 4px; }
</style>
