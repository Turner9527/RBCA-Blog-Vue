<script setup>
import { reactive, ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, roleName: '' })

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, roleName: '', roleKey: '', sortOrder: 0, status: 1, remark: '' })

const menuDialogVisible = ref(false)
const currentRoleId = ref(null)
const menuTree = ref([])
const menuTreeRef = ref(null)

function buildTree(menus, parentId = 0) {
  return (menus || [])
    .filter((m) => m.parentId === parentId)
    .map((m) => ({ ...m, children: buildTree(menus, m.id) }))
}

async function load() {
  const res = await request.get('/system/role/page', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  } else {
    ElMessage.error(res.msg || '加载失败')
  }
}

function resetForm() {
  form.id = null
  form.roleName = ''
  form.roleKey = ''
  form.sortOrder = 0
  form.status = 1
  form.remark = ''
}

function openAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.roleName = row.roleName
  form.roleKey = row.roleKey
  form.sortOrder = row.sortOrder
  form.status = row.status
  form.remark = row.remark
  dialogVisible.value = true
}

async function save() {
  if (!form.roleName || !form.roleKey) {
    ElMessage.warning('请填写角色名称和角色标识')
    return
  }
  const res = isEdit.value
    ? await request.put('/system/role/' + form.id, form)
    : await request.post('/system/role', form)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除角色 ' + row.roleName + ' 吗？', '提示', { type: 'warning' })
  const res = await request.delete('/system/role/' + row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    load()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

async function openAssignMenus(row) {
  currentRoleId.value = row.id
  menuDialogVisible.value = true
  const menuRes = await request.get('/system/menu')
  if (menuRes.code !== 200) {
    ElMessage.error(menuRes.msg || '加载菜单失败')
    return
  }
  menuTree.value = buildTree(menuRes.data, 0)

  const roleMenuRes = await request.get('/system/role/' + row.id + '/menus')
  if (roleMenuRes.code === 200) {
    await nextTick()
    menuTreeRef.value.setCheckedKeys(roleMenuRes.data)
  }
}

async function saveMenus() {
  const checked = menuTreeRef.value.getCheckedKeys()
  const half = menuTreeRef.value.getHalfCheckedKeys()
  const menuIds = [...checked, ...half]
  const res = await request.put('/system/role/' + currentRoleId.value + '/menus', menuIds)
  if (res.code === 200) {
    ElMessage.success('分配成功')
    menuDialogVisible.value = false
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
        <el-input v-model="query.roleName" placeholder="请输入角色名称" clearable style="width: 220px" @keyup.enter="load" />
        <el-button type="primary" @click="load">搜索</el-button>
        <el-button v-if="userStore.hasPerm('system:role:add')" type="success" @click="openAdd">新增角色</el-button>
      </div>

      <el-table :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleKey" label="角色标识" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button v-if="userStore.hasPerm('system:role:edit')" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="userStore.hasPerm('system:role:edit')" link type="primary" @click="openAssignMenus(row)">分配菜单</el-button>
            <el-button v-if="userStore.hasPerm('system:role:remove')" link type="danger" @click="remove(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="角色名称">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识">
          <el-input v-model="form.roleKey" placeholder="如 admin" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="menuDialogVisible" title="分配菜单" width="480px">
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        node-key="id"
        show-checkbox
        :props="{ label: 'menuName', children: 'children' }"
      />
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMenus">保存</el-button>
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
