<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
    <!-- Rule ID and Status -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
        {{ rule.id }}
      </span>
      <div class="flex items-center gap-2">
        <button
          v-if="!rule.isExisting"
          @click="handleSaveRule(rule)"
          :disabled="saving"
          :class="[
            'inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors',
            'bg-blue-100 text-blue-600 hover:bg-blue-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          ]"
          :title="'点击保存规则: ' + rule.description"
        >
          <svg v-if="!saving" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
          </svg>
          <svg v-else class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
        <span 
          v-else-if="rule.isExisting !== undefined"
          :class="[
            'inline-flex items-center justify-center w-6 h-6 rounded-full',
            rule.isExisting
              ? 'bg-green-100 text-green-600'
              : 'bg-blue-100 text-blue-600'
          ]"
          :title="rule.isExisting ? '该规则已保存到系统' : 'AI建议的新规则'"
        >
          <svg v-if="rule.isExisting" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
          </svg>
        </span>
        <span v-else class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600" title="AI 建议的新规则">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
          </svg>
        </span>
      </div>
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
import { ref } from 'vue'
import type { AccountingRule } from '../../types'

interface RuleWithStatus extends AccountingRule {
  isExisting?: boolean
}

const props = defineProps<{
  rule: RuleWithStatus
}>()

const emit = defineEmits<{
  (e: 'save-rule', rule: AccountingRule): void
}>()

const saving = ref(false)

async function handleSaveRule(rule: AccountingRule) {
  saving.value = true
  try {
    emit('save-rule', rule)
  } finally {
    setTimeout(() => {
      saving.value = false
    }, 1000)
  }
}
</script>
