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

    <!-- Loading state -->
    <div v-if="pageLoading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error state -->
    <div v-else-if="pageError" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ pageError }}</p>
      <NuxtLink to="/admin/systems" class="mt-2 text-sm text-red-600 hover:text-red-800">
        返回体系列表
      </NuxtLink>
    </div>

    <!-- Edit form -->
    <div v-else class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center gap-3 mb-6">
        <h1 class="text-2xl font-bold text-gray-900">编辑会计体系</h1>
        <SystemBadge v-if="system" :type="system.type" />
        <SystemBadge v-if="system" :status="system.status" />
      </div>

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
            :disabled="system?.type === 'builtin'"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="例如：管理报告 2024"
          />
          <p v-if="system?.type === 'builtin'" class="mt-1 text-sm text-gray-500">
            内置体系名称不可修改
          </p>
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

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <div class="flex items-center gap-4">
            <label class="inline-flex items-center">
              <input
                v-model="form.status"
                type="radio"
                value="active"
                class="form-radio text-indigo-600"
              />
              <span class="ml-2">启用</span>
            </label>
            
            <label class="inline-flex items-center">
              <input
                v-model="form.status"
                type="radio"
                value="archived"
                class="form-radio text-indigo-600"
              />
              <span class="ml-2">归档</span>
            </label>
          </div>
          <p v-if="form.status === 'archived'" class="mt-2 text-sm text-amber-600">
            归档后该体系将不能用于新的分析
          </p>
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
            {{ loading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSystems, type SystemWithStats } from '~/composables/useSystems'

const route = useRoute()
const router = useRouter()
const { fetchSystem, updateSystem, loading, error } = useSystems()

const systemId = Number(route.params.id)
const system = ref<SystemWithStats | null>(null)
const pageLoading = ref(true)
const pageError = ref('')

const form = ref({
  name: '',
  description: '',
  status: 'active' as 'active' | 'archived'
})

onMounted(async () => {
  try {
    const data = await fetchSystem(systemId)
    if (data) {
      system.value = data
      form.value = {
        name: data.name,
        description: data.description || '',
        status: data.status
      }
    } else {
      pageError.value = '体系不存在'
    }
  } catch (e) {
    pageError.value = '加载失败'
  } finally {
    pageLoading.value = false
  }
})

const handleSubmit = async () => {
  try {
    await updateSystem(systemId, form.value)
    router.push('/admin/systems')
  } catch (e) {
    // Error is already handled in composable
  }
}
</script>
