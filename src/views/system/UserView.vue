<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, username: '' })

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, username: '', password: '', nickname: '', status: 1 })

const roleDialogVisible = ref(false)
const currentUserId = ref(null)
const roleOptions = ref([])
const selectedRoleIds = ref([])

async function load() {
  const res = await request.get('/system/user/page', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  } else {
    ElMessage.error(res.msg || '加载失败')
  }
}

function resetForm() {
  form.id = null
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.status = 1
}

function openAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.username = row.username
  form.password = ''
  form.nickname = row.nickname
  form.status = row.status
  dialogVisible.value = true
}

async function save() {
  if (!form.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!isEdit.value && !form.password) {
    ElMessage.warning('请输入密码')
    return
  }
  const res = isEdit.value
    ? await request.put('/system/user/' + form.id, form)
    : await request.post('/system/user', form)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除用户 ' + row.username + ' 吗？', '提示', { type: 'warning' })
  const res = await request.delete('/system/user/' + row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    load()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

async function loadRoles() {
  const res = await request.get('/system/role')
  if (res.code === 200) {
    roleOptions.value = res.data
  }
}

async function openAssign(row) {
  currentUserId.value = row.id
  selectedRoleIds.value = []
  roleDialogVisible.value = true
  await loadRoles()
  const res = await request.get('/system/user/' + row.id + '/roles')
  if (res.code === 200) {
    selectedRoleIds.value = res.data
  }
}

async function saveRoles() {
  const res = await request.put('/system/user/' + currentUserId.value + '/roles', selectedRoleIds.value)
  if (res.code === 200) {
    ElMessage.success('分配成功')
    roleDialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '分配失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <div class="toolbar">
        <el-input v-model="query.username" placeholder="请输入用户名" clearable style="width: 220px" @keyup.enter="load" />
        <el-button type="primary" @click="load">搜索</el-button>
        <el-button v-if="userStore.hasPerm('system:user:add')" type="success" @click="openAdd">新增用户</el-button>
      </div>

      <el-table :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="name in row.roleNames" :key="name" style="margin-right: 4px">
              {{ name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button v-if="userStore.hasPerm('system:user:edit')" link type="primary"
              @click="openEdit(row)">编辑</el-button>
            <el-button v-if="userStore.hasPerm('system:user:edit')" link type="primary"
              @click="openAssign(row)">分配角色</el-button>
            <el-button v-if="userStore.hasPerm('system:user:remove')" link type="danger"
              @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination class="pager" v-model:current-page="query.pageNum" v-model:page-size="query.pageSize"
        :total="total" layout="total, prev, pager, next" @current-change="load" @size-change="load" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password
            :placeholder="isEdit ? '留空表示不修改密码' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="分配角色" width="480px">
      <el-select v-model="selectedRoleIds" multiple style="width: 100%" placeholder="请选择角色">
        <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
      </el-select>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.pager {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
