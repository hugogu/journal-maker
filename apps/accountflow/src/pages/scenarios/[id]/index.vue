<template>
  <div v-if="scenario" class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex-1">
        <h1 class="text-2xl font-bold">{{ scenario.name }}</h1>
        <p class="text-gray-600 mt-2">{{ scenario.description || '暂无描述' }}</p>
      </div>
      <div class="flex gap-1">
        <NuxtLink 
          :to="`/scenarios/${scenario.id}/edit`"
          class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
          title="编辑"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </NuxtLink>
        <button 
          class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
          title="导出 JSON"
          @click="exportData('json')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
        </button>
        <NuxtLink 
          :to="`/scenarios/${scenario.id}/analyze`"
          class="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
          title="开始分析"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card text-center">
        <p class="text-sm text-gray-600">状态</p>
        <p class="text-lg font-semibold mt-1">{{ statusText(scenario.status) }}</p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-600">类型</p>
        <p class="text-lg font-semibold mt-1">{{ scenario.isTemplate ? '模板' : '普通场景' }}</p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-600">创建时间</p>
        <p class="text-lg font-semibold mt-1">{{ formatDate(scenario.createdAt) }}</p>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">快捷操作</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NuxtLink :to="`/scenarios/${scenario.id}/analyze`" class="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
          <p class="font-medium text-blue-900">AI 分析</p>
          <p class="text-sm text-blue-700 mt-1">与AI对话分析场景</p>
        </NuxtLink>
        <NuxtLink :to="`/scenarios/${scenario.id}/transactions`" class="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
          <p class="font-medium text-green-900">示例交易</p>
          <p class="text-sm text-green-700 mt-1">查看示例记账数据</p>
        </NuxtLink>
        <button class="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors" @click="exportData('json')">
          <p class="font-medium text-purple-900">导出数据</p>
          <p class="text-sm text-purple-700 mt-1">下载分析结果</p>
        </button>
        <button 
          v-if="scenario.status === 'draft'" 
          class="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
          @click="confirmScenario"
        >
          <p class="font-medium text-orange-900">确认场景</p>
          <p class="text-sm text-orange-700 mt-1">标记为已确认</p>
        </button>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-gray-500">加载中...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Scenario {
  id: number
  name: string
  description?: string
  status: string
  isTemplate?: boolean
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const scenario = ref<Scenario | null>(null)

onMounted(async () => {
  const response = await $fetch<{ success: boolean; data: Scenario }>(`/api/scenarios/${route.params.id}`)
  if (response.success) {
    scenario.value = response.data
  }
})

function statusText(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    confirmed: '已确认',
    archived: '已归档'
  }
  return map[status] || status
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

async function confirmScenario() {
  if (!scenario.value) return
  
  try {
    await $fetch(`/api/scenarios/${route.params.id}/confirm`, {
      method: 'POST'
    })
    scenario.value.status = 'confirmed'
    alert('场景已确认')
  } catch (e) {
    console.error('Failed to confirm scenario:', e)
    alert('操作失败')
  }
}

function exportData(format: string) {
  const url = `/api/scenarios/${route.params.id}/export?format=${format}`
  window.open(url, '_blank')
}
</script>
