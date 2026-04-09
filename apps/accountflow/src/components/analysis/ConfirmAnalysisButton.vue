<template>
  <button
    v-if="canConfirm"
    @click="handleConfirm"
    :disabled="disabled || confirming"
    class="text-gray-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
    :title="confirming ? '确认中...' : '确认分析结果'"
  >
    <svg v-if="confirming" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
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
  structuredData?: any  // Add structuredData prop
}>()

const emit = defineEmits<{
  (e: 'confirm', data: { parsed: ParsedAnalysis; messageId?: number }): void
}>()

const confirming = ref(false)

const parsedContent = computed(() => {
  // Prefer structuredData if available (from API response)
  if (props.structuredData) {
    const sd = props.structuredData
    // Map accounts to subjects
    let subjects = sd.subjects || []
    if (sd.accounts) {
      subjects = sd.accounts.map((a: any) => ({
        code: a.code,
        name: a.name,
        direction: a.type === 'asset' ? 'debit' : a.type === 'liability' ? 'credit' : 'debit',
        description: a.reason,
      }))
    }
    // Map rules with debit/credit normalization
    const rules = (sd.rules || []).map((r: any, index: number) => ({
      id: r.id || `RULE-${String(index + 1).padStart(3, '0')}`,
      event: r.event || r.eventName,
      description: r.description || '',
      condition: r.condition,
      debitAccount: r.debitAccount || r.debit,
      creditAccount: r.creditAccount || r.credit,
    }))
    
    // Extract Mermaid diagrams from messageContent (structuredData may not have them)
    const diagrams: string[] = []
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/gi
    let match
    while ((match = mermaidRegex.exec(props.messageContent)) !== null) {
      diagrams.push(match[1].trim())
    }
    
    return {
      subjects,
      rules,
      diagrams,
      entries: [],
      rawContent: props.messageContent,
    }
  }
  
  // Fallback: parse messageContent
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
