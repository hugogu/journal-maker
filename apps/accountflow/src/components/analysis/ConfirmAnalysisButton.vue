<template>
  <button
    v-if="canConfirm"
    @click="handleConfirm"
    :disabled="disabled || confirming"
    class="text-gray-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
    :title="confirming ? '确认中...' : '确认分析结果'"
  >
    <svg
      v-if="confirming"
      class="w-4 h-4 animate-spin"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      ></path>
    </svg>
    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 13l4 4L19 7"
      ></path>
    </svg>
  </button>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { parseAIResponse, hasExtractableContent } from '../../utils/ai-response-parser'
  import type { ParsedAnalysis } from '../../types'

  const props = defineProps<{
    messageContent: string
    messageId?: number
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'confirm', data: { parsed: ParsedAnalysis; messageId?: number }): void
  }>()

  const confirming = ref(false)

  const parsedContent = computed(() => {
    if (!props.messageContent) return null
    return parseAIResponse(props.messageContent)
  })

  const canConfirm = computed(() => {
    if (props.disabled) return false
    if (!parsedContent.value) return false
    return hasExtractableContent(parsedContent.value)
  })

  async function handleConfirm() {
    if (!parsedContent.value || !canConfirm.value) return

    confirming.value = true
    try {
      emit('confirm', {
        parsed: parsedContent.value,
        messageId: props.messageId,
      })
    } finally {
      // Reset after a short delay to show feedback
      setTimeout(() => {
        confirming.value = false
      }, 500)
    }
  }
</script>
