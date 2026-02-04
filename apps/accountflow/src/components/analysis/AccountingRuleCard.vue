<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
    <!-- Rule ID -->
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
        {{ rule.id }}
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
    <div v-if="rule.debitAccount || rule.creditAccount" class="space-y-1">
      <div v-if="rule.debitAccount" class="flex items-center text-sm">
        <span class="w-6 text-center font-medium text-amber-600">借</span>
        <span class="font-mono text-blue-600 ml-2">{{ rule.debitAccount }}</span>
      </div>
      <div v-if="rule.creditAccount" class="flex items-center text-sm">
        <span class="w-6 text-center font-medium text-emerald-600">贷</span>
        <span class="font-mono text-blue-600 ml-2">{{ rule.creditAccount }}</span>
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
