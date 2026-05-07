import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})


api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)


export const authApi = {
  me: () => api.get('/auth/me'),
  
  requestSignupOtp: data => api.post('/auth/request-signup-otp', data),
  requestLoginOtp: data => api.post('/auth/request-login-otp', data),
  verifyOtp: data => api.post('/auth/verify-otp', data),
  signupWithOtp: data => api.post('/auth/signup-with-otp', data),
  loginWithOtp: data => api.post('/auth/login-with-otp', data),

  initiateSignup: data => api.post('/auth/signup', data),
  completeSignup: data => api.post('/auth/signup-verify', data),
  initiateLogin: data => api.post('/auth/login', data),
  completeLogin: data => api.post('/auth/login-verify', data)
}

export const projectApi = {
  list: () => api.get('/projects'),
  get: id => api.get(`/projects/${id}`),
  create: data => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: id => api.delete(`/projects/${id}`),
  getMembers: id => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMemberRole: (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}/role`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
  getAllUsers: () => api.get('/projects/users')
}

export const taskApi = {
  listByProject: projectId => api.get(`/projects/${projectId}/tasks`),
  get: taskId => api.get(`/tasks/${taskId}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  updateStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
  delete: taskId => api.delete(`/tasks/${taskId}`),
  myTasks: () => api.get('/tasks/my')
}

export const dashboardApi = {
  get: () => api.get('/dashboard')
}

export default api