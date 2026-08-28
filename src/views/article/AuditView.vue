<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, status: '' })

const dialogVisible = ref(false)
const currentId = ref(null)
const currentArticle = ref(null)
const form = reactive({ approved: true, comment: '' })

const viewDialogVisible = ref(false)

const statusText = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '未通过' }
const statusType = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

async function load() {
  const res = await request.get('/article/audit', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  }
}

function openAudit(row) {
  currentId.value = row.id
  currentArticle.value = row
  form.approved = true
  form.comment = ''
  dialogVisible.value = true
}

function openView(row) {
  currentArticle.value = row
  viewDialogVisible.value = true
}

async function submitAudit() {
  const res = await request.put('/article/' + currentId.value + '/audit', form)
  if (res.code === 200) {
    ElMessage.success('审核完成')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '审核失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除该文章吗？', '提示', { type: 'warning' })
  const res = await request.delete('/article/' + row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    load()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <div class="toolbar">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 160px" @change="load">
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="未通过" value="REJECTED" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>
      <el-table :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="authorName" label="作者" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditComment" label="审核意见" />
        <el-table-column prop="createTime" label="发布时间" width="170" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button link type="info" @click="openView(row)">查看</el-button>
            <el-button v-if="row.status === 'PENDING'" link type="primary" @click="openAudit(row)">审核</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
        @size-change="load"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="审核文章" width="640px">
      <div v-if="currentArticle" class="article-preview">
        <h3>{{ currentArticle.title }}</h3>
        <div class="preview-meta">作者：{{ currentArticle.authorName }}</div>
        <div class="preview-content">{{ currentArticle.content }}</div>
      </div>
      <el-divider />
      <el-form :model="form" label-width="70px">
        <el-form-item label="结果">
          <el-radio-group v-model="form.approved">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意见">
          <el-input v-model="form.comment" type="textarea" :rows="3" placeholder="审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="文章内容" width="640px">
      <div v-if="currentArticle" class="article-preview">
        <h3>{{ currentArticle.title }}</h3>
        <div class="preview-meta">作者：{{ currentArticle.authorName }} · {{ currentArticle.createTime }}</div>
        <div class="preview-content">{{ currentArticle.content }}</div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.pager { margin-top: 14px; justify-content: flex-end; }
.article-preview h3 { margin: 0 0 8px; }
.preview-meta { color: #909399; font-size: 13px; margin-bottom: 12px; }
.preview-content { white-space: pre-wrap; line-height: 1.8; max-height: 320px; overflow: auto; }
</style>
