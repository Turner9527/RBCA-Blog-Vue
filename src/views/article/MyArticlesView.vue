<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10 })

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, title: '', content: '' })

const statusText = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '未通过' }
const statusType = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

async function load() {
  const res = await request.get('/article/my', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  }
}

function openPublish() {
  isEdit.value = false
  form.id = null
  form.title = ''
  form.content = ''
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.content = row.content
  dialogVisible.value = true
}

async function save() {
  if (!form.title || !form.content) {
    ElMessage.warning('请填写标题和正文')
    return
  }
  const res = isEdit.value
    ? await request.put('/article/' + form.id, form)
    : await request.post('/article', form)
  if (res.code === 200) {
    ElMessage.success(isEdit.value ? '已重新提交审核' : '发布成功')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '操作失败')
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
        <el-button type="primary" @click="load">刷新</el-button>
        <el-button type="success" @click="openPublish">发布文章</el-button>
      </div>
      <el-table :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditComment" label="审核意见" />
        <el-table-column prop="createTime" label="发布时间" width="170" />
        <el-table-column prop="auditTime" label="审核时间" width="170" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="row.status === 'REJECTED'" link type="primary" @click="openEdit(row)">编辑重交</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑文章' : '发布文章'" width="600px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.content" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
