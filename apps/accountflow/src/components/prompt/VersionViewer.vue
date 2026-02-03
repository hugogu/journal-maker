<template>
  <div class="version-viewer">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">版本历史</h3>
      <span class="text-sm text-gray-500">共 {{ versions.length }} 个版本</span>
    </div>

    <div class="space-y-3">
      <div
        v-for="version in sortedVersions"
        :key="version.id"
        :class="[
          'border rounded-lg p-4 cursor-pointer transition-colors',
          selectedVersion?.id === version.id
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        ]"
        @click="selectVersion(version)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-medium">v{{ version.versionNumber }}</span>
            <span
              v-if="isActiveVersion(version)"
              class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
            >
              当前激活
            </span>
          </div>
          <span class="text-sm text-gray-500">{{ formatDate(version.createdAt) }}</span>
        </div>

        <div class="mt-2 text-sm text-gray-600">
          <p v-if="version.changeDescription" class="line-clamp-2">
            {{ version.changeDescription }}
          </p>
          <p v-else class="text-gray-400 italic">无变更说明</p>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button
            v-if="!isActiveVersion(version)"
            @click.stop="$emit('activate', version.id)"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            激活此版本
          </button>
          <button
            v-if="selectedVersion?.id !== version.id"
            @click.stop="selectVersion(version)"
            class="text-sm text-gray-600 hover:text-gray-800"
          >
            查看内容
          </button>
          <button
            v-if="canCompare(version)"
            @click.stop="$emit('compare', version)"
            class="text-sm text-gray-600 hover:text-gray-800"
          >
            对比当前
          </button>
        </div>
      </div>
    </div>

    <!-- Selected Version Content -->
    <div v-if="selectedVersion" class="mt-6 border rounded-lg p-4 bg-gray-50">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium">版本 v{{ selectedVersion.versionNumber }} 内容</h4>
        <button
          @click="selectedVersion = null"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          关闭
        </button>
      </div>
      <pre class="text-sm bg-white p-3 rounded border overflow-auto max-h-96 whitespace-pre-wrap">{{ selectedVersion.content }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface PromptVersion {
  id: string
  versionNumber: number
  content: string
  changeDescription?: string
  createdAt: string
}

export interface PromptTemplate {
  id: string
  name: string
  activeVersionId?: string
  versions: PromptVersion[]
}

const props = defineProps<{
  template: PromptTemplate
  activeVersionId?: string
}>()

const emit = defineEmits<{
  activate: [versionId: string]
  compare: [version: PromptVersion]
}>()

const selectedVersion = ref<PromptVersion | null>(null)

const sortedVersions = computed(() => {
  return [...props.template.versions].sort((a, b) => b.versionNumber - a.versionNumber)
})

function selectVersion(version: PromptVersion) {
  selectedVersion.value = version
}

function isActiveVersion(version: PromptVersion): boolean {
  return props.activeVersionId === version.id ||
         (props.template.activeVersionId === version.id)
}

function canCompare(version: PromptVersion): boolean {
  const activeVersion = props.template.versions.find(v => isActiveVersion(v))
  return activeVersion !== undefined && activeVersion.id !== version.id
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
