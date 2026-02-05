<template>
  <div class="diff-viewer">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <span class="text-sm">
          <span class="font-medium">旧版本:</span> v{{ oldVersion.versionNumber }}
        </span>
        <span class="text-gray-400">→</span>
        <span class="text-sm">
          <span class="font-medium text-green-600">新版本:</span> v{{ newVersion.versionNumber }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span class="flex items-center gap-1">
          <span class="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
          删除
        </span>
        <span class="flex items-center gap-1">
          <span class="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
          新增
        </span>
      </div>
    </div>

    <div class="diff-content border rounded-lg overflow-hidden">
      <div
        class="diff-header bg-gray-100 px-4 py-2 text-sm font-medium border-b flex items-center justify-between"
      >
        <span>内容对比</span>
        <span class="text-xs text-gray-500"
          >{{ diffStats.additions }} 处新增, {{ diffStats.deletions }} 处删除</span
        >
      </div>
      <div class="max-h-96 overflow-auto">
        <div
          v-for="(line, index) in diffLines"
          :key="index"
          :class="[
            'diff-line px-4 py-1 text-sm font-mono whitespace-pre-wrap',
            line.type === 'added' && 'bg-green-50 border-l-4 border-green-400',
            line.type === 'removed' && 'bg-red-50 border-l-4 border-red-400',
            line.type === 'unchanged' && 'bg-white border-l-4 border-transparent',
          ]"
        >
          <span class="diff-line-number text-gray-400 select-none w-8 inline-block">{{
            line.lineNumber
          }}</span>
          <span class="diff-line-content">{{ line.content }}</span>
        </div>
      </div>
    </div>

    <div v-if="newVersion.changeDescription" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <span class="text-sm font-medium text-blue-800">变更说明:</span>
      <p class="text-sm text-blue-700 mt-1">{{ newVersion.changeDescription }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  export interface PromptVersion {
    id: string
    versionNumber: number
    content: string
    changeDescription?: string
    createdAt: string
  }

  interface DiffLine {
    type: 'added' | 'removed' | 'unchanged'
    content: string
    lineNumber: number
  }

  const props = defineProps<{
    oldVersion: PromptVersion
    newVersion: PromptVersion
  }>()

  const diffLines = computed((): DiffLine[] => {
    const oldLines = props.oldVersion.content.split('\n')
    const newLines = props.newVersion.content.split('\n')
    const result: DiffLine[] = []

    // Simple line-by-line diff
    const maxLen = Math.max(oldLines.length, newLines.length)
    let lineNumber = 1

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === undefined) {
        // Line added
        result.push({
          type: 'added',
          content: newLine,
          lineNumber: lineNumber++,
        })
      } else if (newLine === undefined) {
        // Line removed
        result.push({
          type: 'removed',
          content: oldLine,
          lineNumber: lineNumber++,
        })
      } else if (oldLine !== newLine) {
        // Line changed - show both
        result.push({
          type: 'removed',
          content: oldLine,
          lineNumber: lineNumber,
        })
        result.push({
          type: 'added',
          content: newLine,
          lineNumber: lineNumber,
        })
        lineNumber++
      } else {
        // Unchanged
        result.push({
          type: 'unchanged',
          content: oldLine,
          lineNumber: lineNumber++,
        })
      }
    }

    return result
  })

  const diffStats = computed(() => {
    return {
      additions: diffLines.value.filter((l) => l.type === 'added').length,
      deletions: diffLines.value.filter((l) => l.type === 'removed').length,
    }
  })
</script>

<style scoped>
  .diff-line {
    line-height: 1.5;
  }

  .diff-line.added .diff-line-content::before {
    content: '+ ';
    color: #16a34a;
    font-weight: bold;
  }

  .diff-line.removed .diff-line-content::before {
    content: '- ';
    color: #dc2626;
    font-weight: bold;
  }

  .diff-line.unchanged .diff-line-content::before {
    content: '  ';
  }
</style>
