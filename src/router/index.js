import { createRouter, createWebHistory } from 'vue-router'
import LayoutView from '@/layout/LayoutView.vue'
import BlogLayout from '@/layout/BlogLayout.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/blog',
      component: BlogLayout,
      children: [
        { path: '', name: 'blog-home', component: () => import('../views/article/PublicArticleListView.vue') },
        { path: 'articles/:id', name: 'blog-detail', component: () => import('../views/article/PublicArticleDetailView.vue') },
        { path: 'my', name: 'blog-my', component: () => import('../views/article/MyArticlesView.vue') },
        { path: 'write', name: 'blog-write', component: () => import('../views/article/ArticleWriteView.vue') },
        { path: 'user/:id', name: 'blog-profile', component: () => import('../views/profile/ProfileView.vue') },
      ],
    },
    {
      path: '/',
      component: LayoutView,
      redirect: '/home',
      children: [
        { path: 'home', name: 'home', component: HomeView },
        { path: 'system/user', name: 'system-user', component: () => import('../views/system/UserView.vue') },
        { path: 'system/role', name: 'system-role', component: () => import('../views/system/RoleView.vue') },
        { path: 'system/menu', name: 'system-menu', component: () => import('../views/system/MenuView.vue') },
        { path: 'article/my', name: 'article-my', component: () => import('../views/article/MyArticlesView.vue') },
        { path: 'article/audit', name: 'article-audit', component: () => import('../views/article/AuditView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  let roles = []
  try { roles = JSON.parse(localStorage.getItem('roles') || '[]') } catch (e) { roles = [] }
  const isAdmin = roles.includes('admin')

  // 首页：根据身份跳转
  if (to.path === '/') {
    if (!token) return '/blog'
    return isAdmin ? '/home' : '/blog'
  }

  // 登录页：已登录则跳走
  if (to.path === '/login') {
    if (!token) return true
    return isAdmin ? '/home' : '/blog'
  }

  // 管理端路由
  const adminPaths = ['/home', '/system/', '/article/']
  const isAdminPath = adminPaths.some((p) => to.path === p || to.path.startsWith(p))
  if (isAdminPath) {
    if (!token) return '/login'
    if (!isAdmin) return '/blog'
  }

  // 博客“我的文章”需要登录
  if (to.path === '/blog/my' && !token) {
    return '/login'
  }

  return true
})

export default router
