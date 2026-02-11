import { useToast } from '~/composables/useToast'

export default defineNuxtPlugin((nuxtApp) => {
  const toast = useToast()

  // Handle Vue errors
  nuxtApp.vueApp.config.errorHandler = (error: any, instance, info) => {
    console.error('Vue error:', error, info)

    // Extract meaningful error message
    const message = error?.data?.message || error?.message || '发生未知错误'
    toast.error(message)
  }

  // Handle Nuxt errors
  nuxtApp.hook('vue:error', (error: any, instance, info) => {
    console.error('Nuxt error:', error, info)

    const message = error?.data?.message || error?.message || '发生未知错误'
    toast.error(message)
  })

  // Handle unhandled promise rejections
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)

      const error = event.reason
      const message = error?.data?.message || error?.message || '操作失败，请重试'
      toast.error(message)
    })
  }
})
