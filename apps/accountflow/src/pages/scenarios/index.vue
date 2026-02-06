<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">业务场景</h1>
      <NuxtLink to="/scenarios/new" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        新建场景
      </NuxtLink>
    </div>

    <div class="grid gap-3">
      <div
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
      >
        <div class="p-5">
          <!-- Header with title and meta info -->
          <div class="flex items-start justify-between gap-4 mb-3">
            <NuxtLink
              :to="`/scenarios/${scenario.id}`"
              class="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors flex-1"
            >
              <h3>{{ scenario.name }}</h3>
            </NuxtLink>

            <!-- Status and date on the right -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                :class="{
                  'bg-yellow-100 text-yellow-800 border border-yellow-200':
                    scenario.status === 'draft',
                  'bg-green-100 text-green-800 border border-green-200':
                    scenario.status === 'confirmed',
                  'bg-gray-100 text-gray-800 border border-gray-200':
                    scenario.status === 'archived',
                }"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ statusText(scenario.status) }}
              </span>
              <span
                v-if="scenario.isTemplate"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                模板
              </span>
              <span class="text-gray-500 text-xs whitespace-nowrap">
                {{ formatDate(scenario.createdAt) }}
              </span>
            </div>
          </div>

          <!-- Description with more lines -->
          <p class="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-4">
            {{ scenario.description || '暂无描述' }}
          </p>

          <!-- Action links (always visible) -->
          <div class="flex items-center gap-4 pt-3 border-t border-gray-100">
            <NuxtLink
              :to="`/scenarios/${scenario.id}/edit`"
              class="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              编辑
            </NuxtLink>
            <NuxtLink
              :to="`/scenarios/${scenario.id}/analyze`"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              AI 分析
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="scenarios.length === 0" class="text-center py-16">
      <svg
        class="w-16 h-16 mx-auto mb-4 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        ></path>
      </svg>
      <p class="text-gray-500 mb-4">暂无场景</p>
      <NuxtLink to="/scenarios/new" class="text-blue-600 hover:text-blue-700 font-medium">
        点击"新建场景"创建第一个业务场景 →
      </NuxtLink>
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
      archived: '已归档',
    }
    return map[status] || status
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</script>
