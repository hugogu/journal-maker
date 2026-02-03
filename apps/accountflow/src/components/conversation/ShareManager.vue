<template>
  <div class="share-manager">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">分享管理</h3>
      <button
        @click="createNewShare"
        :disabled="loading"
        class="btn-primary text-sm"
      >
        {{ loading ? '创建中...' : '创建分享链接' }}
      </button>
    </div>

    <div v-if="error" class="text-red-600 text-sm mb-3">{{ error }}</div>

    <div v-if="shares.length === 0" class="text-gray-500 text-sm">
      暂无分享链接
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="share in activeShares"
        :key="share.id"
        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">{{ formatDate(share.createdAt) }}</span>
            <span
              v-if="share.isRevoked"
              class="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
            >
              已撤销
            </span>
          </div>
          <div class="text-sm font-mono text-gray-700 truncate mt-1">
            {{ getShareUrl(share.shareToken) }}
          </div>
        </div>
        <div class="flex items-center gap-2 ml-2">
          <button
            @click="copyUrl(share.shareToken)"
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="复制链接"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
          <button
            v-if="!share.isRevoked"
            @click="revokeShare(share.id)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            title="撤销分享"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useConversationShare } from '../../../composables/useConversationShare'

const props = defineProps<{
  scenarioId: number
}>()

const { shares, loading, error, fetchShares, createShare, revokeShare, getShareUrl } = useConversationShare(props.scenarioId)

const activeShares = computed(() => {
  return [...shares.value].sort((a, b) => {
    // Active shares first, then by creation date
    if (a.isRevoked !== b.isRevoked) return a.isRevoked ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

onMounted(() => {
  fetchShares()
})

async function createNewShare() {
  await createShare()
}

async function revoke(id: number) {
  await revokeShare(id)
}

function copyUrl(token: string) {
  const url = getShareUrl(token)
  navigator.clipboard.writeText(url).then(() => {
    alert('链接已复制到剪贴板')
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>
