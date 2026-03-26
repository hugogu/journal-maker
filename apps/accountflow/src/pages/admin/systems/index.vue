<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">会计体系管理</h1>
        <p class="text-gray-600 mt-1">管理财务和管理会计体系</p>
      </div>
      
      <NuxtLink
        to="/admin/systems/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        新建体系
      </NuxtLink>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
      <button
        @click="fetchSystems"
        class="mt-2 text-sm text-red-600 hover:text-red-800"
      >
        重试
      </button>
    </div>

    <!-- Systems list -->
    <div v-else-if="systems.length" class="space-y-4">
      <SystemCard
        v-for="system in systems"
        :key="system.id"
        :system="system"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
      </svg>
      <p class="mt-4 text-gray-600">暂无会计体系</p>
      <NuxtLink
        to="/admin/systems/new"
        class="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800"
      >
        创建第一个体系 →
      </NuxtLink>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showDeleteModal = false"></div>
          
          <div class="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 class="text-lg font-medium text-gray-900">确认删除</h3>
            <p class="mt-2 text-sm text-gray-500">
              确定要删除体系 "{{ systemToDelete?.name }}" 吗？此操作无法撤销。
            </p>
            
            <div class="mt-4 flex justify-end gap-3">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                @click="confirmDelete"
                :disabled="deleteLoading"
                class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {{ deleteLoading ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSystems, type SystemWithStats } from '~/composables/useSystems'

const router = useRouter()
const { systems, loading, error, fetchSystems, deleteSystem } = useSystems()

const showDeleteModal = ref(false)
const systemToDelete = ref<SystemWithStats | null>(null)
const deleteLoading = ref(false)

onMounted(() => {
  fetchSystems()
})

const handleEdit = (system: SystemWithStats) => {
  router.push(`/admin/systems/${system.id}/edit`)
}

const handleDelete = (system: SystemWithStats) => {
  systemToDelete.value = system
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!systemToDelete.value) return
  
  deleteLoading.value = true
  try {
    await deleteSystem(systemToDelete.value.id)
    showDeleteModal.value = false
    systemToDelete.value = null
  } catch (e) {
    // Error is already handled in composable
  } finally {
    deleteLoading.value = false
  }
}
</script>
