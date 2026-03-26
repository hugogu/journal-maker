<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <NuxtLink
        to="/admin/systems"
        class="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        返回体系列表
      </NuxtLink>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">新建会计体系</h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">
            体系名称 *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            maxlength="255"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="例如：管理报告 2024"
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">
            描述
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            maxlength="1000"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="描述该体系的用途和特点..."
          /></textarea>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <NuxtLink
            to="/admin/systems"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </NuxtLink>
          
          <button
            type="submit"
            :disabled="loading || !form.name.trim()"
            class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? '创建中...' : '创建体系' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSystems } from '~/composables/useSystems'

const router = useRouter()
const { createSystem, loading, error } = useSystems()

const form = ref({
  name: '',
  description: ''
})

const handleSubmit = async () => {
  try {
    await createSystem(form.value)
    router.push('/admin/systems')
  } catch (e) {
    // Error is already handled in composable
  }
}
</script>
