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
          <div class="flex gap-2">
            <NuxtLink 
              :to="`/scenarios/${scenario.id}`" 
              class="btn-secondary text-sm"
            >
              查看
            </NuxtLink>
            <NuxtLink 
              :to="`/scenarios/${scenario.id}/analyze`" 
              class="btn-primary text-sm"
            >
              分析
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
