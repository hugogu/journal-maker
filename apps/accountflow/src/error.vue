<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ error?.statusCode || 500 }}</h1>
      <p class="text-gray-600 mb-6">{{ error?.statusMessage || '出错了' }}</p>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        @click="handleError"
      >
        返回首页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app'

  const props = defineProps<{
    error: NuxtError
  }>()

  const handleError = () => clearError({ redirect: '/' })
</script>
