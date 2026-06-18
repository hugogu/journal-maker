<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">记账规则管理</h1>
        <p class="text-sm text-gray-600 mt-1">查看和管理所有会计记账规则</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索规则名称、描述..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keyup.enter="handleSearch"
          />
        </div>
        <select
          v-model="selectedScenario"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有场景</option>
          <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">
            {{ scenario.name }}
          </option>
        </select>
        <button
          @click="handleSearch"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          搜索
        </button>
      </div>
    </div>

    <!-- Rules Table -->
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">业务事件</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">借方科目</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">贷方科目</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">所属场景</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">状态</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">创建时间</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="rule in rules" :key="rule.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-mono text-gray-600">
              #{{ rule.id }}
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-gray-900">{{ rule.eventName }}</div>
              <div v-if="rule.eventDescription" class="text-xs text-gray-500 mt-1 line-clamp-1">
                {{ rule.eventDescription }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div v-if="rule.debitAccount" class="flex items-center gap-2">
                <span class="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">借</span>
                <div>
                  <div class="text-sm font-medium text-blue-600">{{ rule.debitAccount.code }}</div>
                  <div class="text-xs text-gray-500">{{ rule.debitAccount.name }}</div>
                </div>
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </td>
            <td class="px-6 py-4">
              <div v-if="rule.creditAccount" class="flex items-center gap-2">
                <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">贷</span>
                <div>
                  <div class="text-sm font-medium text-blue-600">{{ rule.creditAccount.code }}</div>
                  <div class="text-xs text-gray-500">{{ rule.creditAccount.name }}</div>
                </div>
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ rule.scenario?.name || '-' }}
            </td>
            <td class="px-6 py-4">
              <span
                :class="{
                  'px-2 py-1 text-xs rounded-full': true,
                  'bg-green-100 text-green-700': rule.status === 'confirmed',
                  'bg-yellow-100 text-yellow-700': rule.status === 'proposal',
                }"
              >
                {{ rule.status === 'confirmed' ? '已确认' : '建议' }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ formatDate(rule.createdAt) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink
                  :to="`/journal-rules/${rule.id}`"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="查看详情"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </NuxtLink>
                <button
                  @click="deleteRule(rule.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="删除"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="rules.length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p class="text-gray-500">暂无记账规则</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-600">
        显示 {{ (pagination.page - 1) * pagination.pageSize + 1 }} - 
        {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} 
        共 {{ pagination.total }} 条
      </div>
      <div class="flex gap-2">
        <button
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        <button
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const rules = ref([])
const scenarios = ref([])
const searchQuery = ref('')
const selectedScenario = ref('')
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
})

async function fetchRules() {
  try {
    const params = new URLSearchParams({
      page: String(pagination.value.page),
      pageSize: String(pagination.value.pageSize),
    })
    
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    
    if (selectedScenario.value) {
      params.append('scenarioId', selectedScenario.value)
    }

    const response = await $fetch(`/api/journal-rules?${params}`)
    
    if (response.success) {
      rules.value = response.data.rules
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Failed to fetch rules:', error)
  }
}

async function fetchScenarios() {
  try {
    const response = await $fetch('/api/scenarios')
    if (response.success) {
      scenarios.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch scenarios:', error)
  }
}

function handleSearch() {
  pagination.value.page = 1
  fetchRules()
}

function changePage(page: number) {
  pagination.value.page = page
  fetchRules()
}

async function deleteRule(id: number) {
  if (!confirm('确定要删除这条记账规则吗？')) return
  
  try {
    const response = await $fetch(`/api/journal-rules/${id}`, {
      method: 'DELETE',
    })
    
    if (response.success) {
      await fetchRules()
    }
  } catch (error) {
    console.error('Failed to delete rule:', error)
    alert('删除失败')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchRules()
  fetchScenarios()
})
</script>
