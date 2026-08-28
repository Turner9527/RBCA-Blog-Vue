import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const permissions = ref([])
  const roles = ref([])
  const menus = ref([])

  async function login(username, password) {
    const res = await request.post('/auth/login', { username, password })
    if (res.code === 200 && res.data?.tokenValue) {
      token.value = res.data.tokenValue
      localStorage.setItem('token', res.data.tokenValue)
      await fetchUserInfo()
      await fetchMenus()
    }
    return res
  }

  async function fetchUserInfo() {
    const res = await request.get('/auth/info')
    if (res.code === 200) {
      userInfo.value = res.data.userInfo
      permissions.value = res.data.permissions || []
      roles.value = res.data.roles || []
      localStorage.setItem('roles', JSON.stringify(roles.value))
    }
    return res
  }

  async function fetchMenus() {
    const res = await request.get('/auth/menus')
    if (res.code === 200) {
      menus.value = res.data || []
    }
    return res
  }

  function hasPerm(perm) {
    return permissions.value.includes(perm)
  }

  async function logout() {
    try {
      await request.post('/auth/logout')
    } catch (e) {
      console.error('后端退出登录失败', e)
    } finally {
      token.value = ''
      userInfo.value = null
      permissions.value = []
      roles.value = []
      menus.value = []
      localStorage.removeItem('token')
      localStorage.removeItem('roles')
    }
  }

  return { token, userInfo, permissions, roles, menus, login, fetchUserInfo, fetchMenus, hasPerm, logout }
})
