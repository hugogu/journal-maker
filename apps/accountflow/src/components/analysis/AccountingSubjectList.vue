<template>
  <div class="overflow-x-auto">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left py-2 px-3 font-medium text-gray-600 whitespace-nowrap">科目代码</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600 whitespace-nowrap">科目名称</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600 whitespace-nowrap">状态</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="subject in subjects"
          :key="subject.code"
          class="border-b border-gray-100 hover:bg-gray-50"
        >
          <td class="py-2 px-3 text-blue-600 font-medium">{{ subject.code }}</td>
          <td class="py-2 px-3">{{ subject.name }}</td>
          <td class="py-2 px-3">
            <button
              v-if="subject.isExisting !== undefined && !subject.isExisting"
              @click="handleSaveSubject(subject)"
              :disabled="saving"
              :class="[
                'inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors',
                'bg-blue-100 text-blue-600 hover:bg-blue-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
              :title="'点击保存科目: ' + subject.name"
            >
              <svg v-if="!saving" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
            <span
              v-else-if="subject.isExisting"
              :class="[
                'inline-flex items-center justify-center w-6 h-6 rounded-full',
                'bg-green-100 text-green-600'
              ]"
              :title="'科目已存在: ' + subject.name"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="subjects.length === 0" class="text-gray-400 text-sm text-center py-4">
      暂无会计科目
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AccountingSubject, Account } from '../../types'

interface SubjectWithStatus extends AccountingSubject {
  isExisting?: boolean
  existingAccount?: Account
}

const props = defineProps<{
  subjects: SubjectWithStatus[]
}>()

const emit = defineEmits<{
  (e: 'save-subject', subject: AccountingSubject): void
}>()

const saving = ref(false)

async function handleSaveSubject(subject: AccountingSubject) {
  saving.value = true
  try {
    emit('save-subject', subject)
  } finally {
    setTimeout(() => {
      saving.value = false
    }, 1000)
  }
}
</script>
