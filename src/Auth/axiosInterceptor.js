// src/api/axiosInterceptor.js
import axios from 'axios'
import { baseUrl } from './BaseUrl'
// adjust import path if needed
import { useNavigate } from 'react-router-dom'
import { useToast } from '../utils/Toaster'
import { showSuccess, showInfo } from '../utils/Toaster'
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 sec timeout to detect slow internet
})

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    if (!config.url.includes('/auth/login')) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (err) => Promise.reject(err),
)

// Response Interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log('AXIOS ERROR:', err) // 👈 check what actually comes here

    if (err.response) {
      const { status } = err.response
      console.log(object)
      switch (err.response) {
        case 401:
          localStorage.removeItem('token')
          showInfo('Session expired. Please log in again.', { title: 'Unauthorized' })
          window.location.href = '/login'
          break

        case 403:
          showInfo('You do not have permission to access this resource.', { title: 'Forbidden' })
          break

        case 404:
          showInfo('The requested resource was not found.', { title: 'Not Found' })
          break

        case 500:
          showInfo('Internal server error. Please try again later.', { title: 'Server Error' })
          break

        default:
          showInfo(`Unexpected error occurred. [${status}]`, { title: 'Error' })
      }
    } else {
      // No response → Network/server issue
      if (err.code === 'ECONNABORTED') {
       // showInfo('Request timed out. Please check your internet connection.', { title: 'Timeout' })
      } else {
        //   showInfo('Network error. Please check your connection.', { title: 'Network Error' })
      }
    }

    return Promise.reject(err)
  },
)

export default api
