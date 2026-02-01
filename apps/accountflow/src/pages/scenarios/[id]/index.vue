<template>
  <div v-if="scenario" class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ scenario.name }}</h1>
        <p class="text-gray-600 mt-1">{{ scenario.description || '暂无描述' }}</p>
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary" @click="exportData('json')">
          导出 JSON
        </button>
        <NuxtLink :to="`/scenarios/${scenario.id}/analyze`" class="btn-primary">
          开始分析
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
