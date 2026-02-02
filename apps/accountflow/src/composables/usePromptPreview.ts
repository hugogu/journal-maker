export const usePromptPreview = () => {
  const previewLoading = ref(false)
  const previewError = ref<string | null>(null)
  const previewResult = ref<{
    original: string
    rendered: string
    unrenderedVars: string[]
    usedVars: string[]
  } | null>(null)

  const previewPrompt = async (content: string, variables?: Record<string, string>) => {
    previewLoading.value = true
    previewError.value = null
    try {
      const { data } = await useFetch('/api/prompts/preview', {
        method: 'POST',
        body: { content, variables }
      })
      if (data.value) {
        previewResult.value = data.value
        return data.value
      }
    } catch (e: any) {
      previewError.value = e?.data?.message || '预览失败'
    } finally {
      previewLoading.value = false
    }
  }

  const clearPreview = () => {
    previewResult.value = null
    previewError.value = null
  }

  return {
    previewLoading: readonly(previewLoading),
    previewError: readonly(previewError),
    previewResult: readonly(previewResult),
    previewPrompt,
    clearPreview
  }
}
