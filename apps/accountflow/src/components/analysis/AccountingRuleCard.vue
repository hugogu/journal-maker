<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
    <!-- Rule ID and Status -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
        {{ rule.id }}
      </span>
      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="AI 建议的会计规则">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
        </svg>
        新建议
      </span>
    </div>

    <!-- Description -->
    <p class="text-sm text-gray-700 mb-3">
      {{ rule.description }}
    </p>

    <!-- Condition -->
    <div v-if="rule.condition" class="mb-3">
      <span class="text-xs font-medium text-gray-500 uppercase">触发条件</span>
      <p class="text-sm text-gray-700 mt-1 bg-gray-50 px-2 py-1 rounded">
        {{ rule.condition }}
      </p>
    </div>

    <!-- Debit/Credit Accounts -->
    <div v-if="rule.debitAccount || rule.creditAccount" class="flex items-center gap-4 text-sm">
      <div v-if="rule.debitAccount" class="flex items-center">
        <span class="w-6 text-center font-medium text-amber-600">借</span>
        <span class="text-blue-600 font-medium ml-2">{{ rule.debitAccount }}</span>
      </div>
      <div v-if="rule.creditAccount" class="flex items-center">
        <span class="w-6 text-center font-medium text-emerald-600">贷</span>
        <span class="text-blue-600 font-medium ml-2">{{ rule.creditAccount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccountingRule } from '../../types'

defineProps<{
  rule: AccountingRule
}>()
</script>
