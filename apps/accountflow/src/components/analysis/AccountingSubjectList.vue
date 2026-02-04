<template>
  <div class="overflow-x-auto">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left py-2 px-3 font-medium text-gray-600">科目代码</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600">科目名称</th>
          <th class="text-left py-2 px-3 font-medium text-gray-600">方向</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="subject in subjects"
          :key="subject.code"
          class="border-b border-gray-100 hover:bg-gray-50"
        >
          <td class="py-2 px-3 font-mono text-blue-600">{{ subject.code }}</td>
          <td class="py-2 px-3">{{ subject.name }}</td>
          <td class="py-2 px-3">
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                subject.direction === 'debit'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              ]"
            >
              {{ subject.direction === 'debit' ? '借方' : '贷方' }}
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
import type { AccountingSubject } from '../../types'

defineProps<{
  subjects: AccountingSubject[]
}>()
</script>
