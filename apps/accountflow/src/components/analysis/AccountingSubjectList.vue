<template>
  <div class="overflow-x-auto">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left py-2 px-3 font-medium text-gray-600">科目代码</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600">科目名称</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600">方向</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600">状态</th>
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
            <span
              :class="[
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                subject.direction === 'debit'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              ]"
            >
              {{ subject.direction === 'debit' ? '借' : '贷' }}
            </span>
          </td>
          <td class="py-2 px-3">
            <span
              v-if="subject.isExisting !== undefined"
              :class="[
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                subject.isExisting
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              ]"
              :title="subject.isExisting ? '该科目已存在于系统中' : '建议新建的科目'"
            >
              <svg v-if="subject.isExisting" class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
              </svg>
              {{ subject.isExisting ? '存在' : '建议' }}
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
import type { AccountingSubject, Account } from '../../types'

interface SubjectWithStatus extends AccountingSubject {
  isExisting?: boolean
  existingAccount?: Account
}

defineProps<{
  subjects: SubjectWithStatus[]
}>()
</script>
