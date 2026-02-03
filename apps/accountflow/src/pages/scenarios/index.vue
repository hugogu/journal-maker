<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">业务场景</h1>
      <NuxtLink to="/scenarios/new" class="btn-primary">
        新建场景
      </NuxtLink>
    </div>

    <div class="grid gap-4">
      <div v-for="scenario in scenarios" :key="scenario.id" class="card">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ scenario.name }}</h3>
            <p class="text-gray-600 mt-1">{{ scenario.description || '暂无描述' }}</p>
            <div class="flex items-center gap-4 mt-3 text-sm">
              <span 
                :class="{
                  'bg-yellow-100 text-yellow-800': scenario.status === 'draft',
                  'bg-green-100 text-green-800': scenario.status === 'confirmed',
                  'bg-gray-100 text-gray-800': scenario.status === 'archived'
                }"
                class="px-2 py-1 rounded"
              >
                {{ statusText(scenario.status) }}
              </span>
              <span v-if="scenario.isTemplate" class="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                模板
              </span>
              <span class="text-gray-500">{{ formatDate(scenario.createdAt) }}</span>
            </div>
          </div>
          <div class="flex gap-1">
            <NuxtLink 
              :to="`/scenarios/${scenario.id}`" 
              class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
              title="查看"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </NuxtLink>
            <NuxtLink 
              :to="`/scenarios/${scenario.id}/analyze`" 
              class="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
              title="分析"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="scenarios.length === 0" class="text-center py-12 text-gray-500">
      暂无场景，点击"新建场景"创建第一个业务场景
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Scenario } from '~/types'

const scenarios = ref<Scenario[]>([])

onMounted(async () => {
  const response = await $fetch('/api/scenarios')
  if (response.success) {
    scenarios.value = response.data
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

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>
