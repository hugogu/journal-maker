<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">示例交易</h1>
      <div class="flex gap-3">
        <button class="btn-secondary" :disabled="generating" @click="generateSample">
          {{ generating ? '生成中...' : 'AI 生成示例' }}
        </button>
        <NuxtLink :to="`/scenarios/${route.params.id}`" class="btn-secondary"> 返回场景 </NuxtLink>
      </div>
    </div>

    <div v-if="transactions.length === 0" class="card text-center py-12">
      <p class="text-gray-500">暂无示例交易</p>
      <p class="text-sm text-gray-400 mt-2">点击 "AI 生成示例" 让 AI 自动生成完整的交易示例</p>
    </div>

    <div v-for="tx in transactions" :key="tx.id" class="card mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{{ tx.description }}</h3>
        <span
          :class="
            tx.generatedBy === 'ai' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          "
          class="px-2 py-1 rounded text-xs"
        >
          {{ tx.generatedBy === 'ai' ? 'AI 生成' : '手动创建' }}
        </span>
      </div>

      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">科目</th>
            <th class="px-4 py-2 text-right text-sm font-medium text-gray-700">借方</th>
            <th class="px-4 py-2 text-right text-sm font-medium text-gray-700">贷方</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">说明</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(entry, idx) in tx.entries" :key="idx">
            <td class="px-4 py-2 text-sm font-medium">
              {{ entry.accountCode }} {{ entry.accountName }}
            </td>
            <td class="px-4 py-2 text-sm text-right font-mono">
              {{ entry.debit ? formatMoney(entry.debit) : '-' }}
            </td>
            <td class="px-4 py-2 text-sm text-right font-mono">
              {{ entry.credit ? formatMoney(entry.credit) : '-' }}
            </td>
            <td class="px-4 py-2 text-sm text-gray-600">
              {{ entry.description }}
            </td>
          </tr>
          <tr class="bg-gray-50 font-medium">
            <td class="px-4 py-2 text-sm">合计</td>
            <td class="px-4 py-2 text-sm text-right font-mono">
              {{ formatMoney(totalDebit(tx.entries)) }}
            </td>
            <td class="px-4 py-2 text-sm text-right font-mono">
              {{ formatMoney(totalCredit(tx.entries)) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const transactions = ref([])
  const generating = ref(false)

  onMounted(async () => {
    await loadTransactions()
  })

  async function loadTransactions() {
    const response = await $fetch(`/api/scenarios/${route.params.id}/transactions`)
    if (response.success) {
      transactions.value = response.data
    }
  }

  async function generateSample() {
    generating.value = true
    try {
      const response = await $fetch(`/api/scenarios/${route.params.id}/transactions`, {
        method: 'POST',
        body: { autoGenerate: true },
      })
      if (response.success) {
        await loadTransactions()
      }
    } catch (e) {
      alert('生成失败')
    } finally {
      generating.value = false
    }
  }

  function formatMoney(amount: number) {
    if (!amount) return '-'
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
  }

  function totalDebit(entries: any[]) {
    return entries.reduce((sum, e) => sum + (e.debit || 0), 0)
  }

  function totalCredit(entries: any[]) {
    return entries.reduce((sum, e) => sum + (e.credit || 0), 0)
  }
</script>
