import { ref } from 'vue'

/**
 * Composable for triggering data exports from the client.
 */
export function useExport() {
  const exporting = ref(false)
  const error = ref<string | null>(null)

  /**
   * Export a single scenario. Opens the export URL in a new tab.
   * For xlsx/csv, the browser will download the file directly.
   */
  async function exportScenario(scenarioId: number, format: 'xlsx' | 'csv') {
    exporting.value = true
    error.value = null

    try {
      const response = await $fetch<Blob | { success: boolean; message?: string }>(
        `/api/scenarios/${scenarioId}/export?format=${format}`,
        { responseType: 'blob' }
      )

      // Check if response is a JSON error (no confirmed rules)
      if (response instanceof Blob && response.type === 'application/json') {
        const text = await response.text()
        try {
          const json = JSON.parse(text)
          if (json.success === false) {
            error.value = json.message || '没有可导出的已确认规则'
            alert(error.value)
            return
          }
        } catch {
          // Not JSON, treat as file download
        }
      }

      if (response instanceof Blob) {
        downloadBlob(response, format, scenarioId)
      }
    } catch (e) {
      error.value = '导出失败'
      console.error('Export failed:', e)
      alert('导出失败，请稍后重试')
    } finally {
      exporting.value = false
    }
  }

  /**
   * Export multiple scenarios via POST endpoint.
   */
  async function exportScenarios(scenarioIds: number[], format: 'xlsx' | 'csv') {
    if (scenarioIds.length === 0) return

    exporting.value = true
    error.value = null

    try {
      const response = await $fetch<Blob | { success: boolean; message?: string }>(
        '/api/scenarios/export',
        {
          method: 'POST',
          body: { scenarioIds, format },
          responseType: 'blob',
        }
      )

      // Check if response is a JSON error
      if (response instanceof Blob && response.type === 'application/json') {
        const text = await response.text()
        try {
          const json = JSON.parse(text)
          if (json.success === false) {
            error.value = json.message || '所选场景中没有可导出的已确认规则'
            alert(error.value)
            return
          }
        } catch {
          // Not JSON, treat as file download
        }
      }

      if (response instanceof Blob) {
        const date = new Date().toISOString().slice(0, 10)
        const ext = format === 'xlsx' ? 'xlsx' : 'zip'
        const filename = `scenarios-export-${date}.${ext}`
        triggerDownload(response, filename)
      }
    } catch (e) {
      error.value = '批量导出失败'
      console.error('Bulk export failed:', e)
      alert('批量导出失败，请稍后重试')
    } finally {
      exporting.value = false
    }
  }

  function downloadBlob(blob: Blob, format: string, scenarioId: number) {
    // Try to extract filename from Content-Disposition header, fallback to generic name
    const ext = format === 'xlsx' ? 'xlsx' : 'zip'
    const filename = `scenario-${scenarioId}-export.${ext}`
    triggerDownload(blob, filename)
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    exporting,
    error,
    exportScenario,
    exportScenarios,
  }
}
