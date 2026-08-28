<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const list = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, parentId: 0, menuName: '', menuType: 'C', path: '', component: '', perms: '', icon: '', sortOrder: 0, status: 1 })

function buildTree(menus, parentId = 0) {
  return (menus || [])
    .filter((m) => m.parentId === parentId)
    .map((m) => ({ ...m, children: buildTree(menus, m.id) }))
}

const treeData = computed(() => buildTree(list.value, 0))

const parentOptions = computed(() => {
  const options = [{ id: 0, menuName: '顶级菜单' }]
  list.value.forEach((m) => options.push({ id: m.id, menuName: m.menuName }))
  return options
})

async function load() {
  const res = await request.get('/system/menu')
  if (res.code === 200) {
    list.value = res.data
  } else {
    ElMessage.error(res.msg || '加载失败')
  }
}

function resetForm() {
  form.id = null
  form.parentId = 0
  form.menuName = ''
  form.menuType = 'C'
  form.path = ''
  form.component = ''
  form.perms = ''
  form.icon = ''
  form.sortOrder = 0
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
  form.parentId = row.parentId
  form.menuName = row.menuName
  form.menuType = row.menuType
  form.path = row.path
  form.component = row.component
  form.perms = row.perms
  form.icon = row.icon
  form.sortOrder = row.sortOrder
  form.status = row.status
  dialogVisible.value = true
}

async function save() {
  if (!form.menuName) {
    ElMessage.warning('请输入菜单名称')
    return
  }
  const res = isEdit.value
    ? await request.put('/system/menu/' + form.id, form)
    : await request.post('/system/menu', form)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '保存失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除菜单 ' + row.menuName + ' 吗？', '提示', { type: 'warning' })
  const res = await request.delete('/system/menu/' + row.id)
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
        <el-button v-if="userStore.hasPerm('system:menu:add')" type="success" @click="openAdd">新增菜单</el-button>
      </div>

      <el-table :data="treeData" row-key="id" border :tree-props="{ children: 'children' }">
        <el-table-column prop="menuName" label="菜单名称" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 'M'">目录</el-tag>
            <el-tag v-else-if="row.menuType === 'C'" type="success">菜单</el-tag>
            <el-tag v-else type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" />
        <el-table-column prop="component" label="组件路径" />
        <el-table-column prop="perms" label="权限标识" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button v-if="userStore.hasPerm('system:menu:edit')" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="userStore.hasPerm('system:menu:remove')" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : '新增菜单'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="父菜单">
          <el-select v-model="form.parentId" style="width: 100%">
            <el-option v-for="p in parentOptions" :key="p.id" :label="p.menuName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单名称">
          <el-input v-model="form.menuName" />
        </el-form-item>
        <el-form-item label="菜单类型">
          <el-select v-model="form.menuType" style="width: 100%">
            <el-option label="目录" value="M" />
            <el-option label="菜单" value="C" />
            <el-option label="按钮" value="F" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="form.path" placeholder="如 user" />
        </el-form-item>
        <el-form-item label="组件路径">
          <el-input v-model="form.component" placeholder="如 system/user/index" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.perms" placeholder="如 system:user:list" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" />
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
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
</style>
