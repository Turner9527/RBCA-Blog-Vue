import axios from 'axios'

// 统一请求封装：所有接口都走这里
const request = axios.create({
  baseURL: '/dev-api',
  timeout: 10000,
})

// 请求拦截器：自动携带登录 token（后端 Sa-Token 从请求头读取）
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    // Sa-Token 默认从名为 satoken 的请求头读取 token
    config.headers.satoken = token
  }
  return config
})

// 响应拦截器：统一处理返回结构和错误
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default request