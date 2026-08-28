<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const form = reactive({ id: null, title: '', content: '' })
const previewHtml = ref('')
const previewMode = ref(false)
const DRAFT_KEY = 'article_draft'

onMounted(async () => {
  if (!localStorage.getItem('token')) {
    router.push('/login')
    return
  }

  const editId = route.query.id
  if (editId) {
    const res = await request.get('/article/' + editId)
    if (res.code === 200) {
      form.id = res.data.id
      form.title = res.data.title
      form.content = res.data.content
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } else {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const d = JSON.parse(draft)
        form.id = d.id || null
        form.title = d.title || ''
        form.content = d.content || ''
      } catch (e) {
        // ignore
      }
    }
  }
})

async function togglePreview() {
  if (!previewMode.value) {
    const res = await request.post('/article/preview', { content: form.content })
    if (res.code === 200) {
      previewHtml.value = res.data
    } else {
      ElMessage.error(res.msg || '预览失败')
    }
  }
  previewMode.value = !previewMode.value
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: form.id, title: form.title, content: form.content }))
  ElMessage.success('草稿已保存到本地')
}

async function submit() {
  if (!form.title || !form.content) {
    ElMessage.warning('请填写标题和正文')
    return
  }
  const body = { title: form.title, content: form.content }
  const res = form.id
    ? await request.put('/article/' + form.id, body)
    : await request.post('/article', body)

  if (res.code === 200) {
    ElMessage.success('已提交审核')
    localStorage.removeItem(DRAFT_KEY)
    router.push('/blog/my')
  } else {
    ElMessage.error(res.msg || '提交失败')
  }
}
</script>

<template>
  <div class="write-wrap">
    <el-card>
      <el-input v-model="form.title" placeholder="文章标题" class="title-input" />
      <div class="toolbar">
        <el-button @click="togglePreview">{{ previewMode ? '编辑' : '预览' }}</el-button>
        <div class="spacer"></div>
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="submit">提交审核</el-button>
      </div>

      <div v-if="previewMode" class="preview" v-html="previewHtml"></div>
      <el-input v-else v-model="form.content" type="textarea" :rows="20" placeholder="支持 Markdown 语法，例如 # 标题、**加粗**、- 列表" />
    </el-card>
  </div>
</template>

<style scoped>
.write-wrap { max-width: 860px; margin: 0 auto; }
.title-input { margin-bottom: 12px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.spacer { flex: 1; }
.preview { min-height: 400px; border: 1px solid #eee; padding: 16px; border-radius: 4px; line-height: 1.7; }
</style>
