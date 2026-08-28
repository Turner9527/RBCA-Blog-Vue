import axios from 'axios'

const interactionRequest = axios.create({
  baseURL: '/interaction',
  timeout: 10000,
})

interactionRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.satoken = token
  }
  return config
})

interactionRequest.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default interactionRequest
