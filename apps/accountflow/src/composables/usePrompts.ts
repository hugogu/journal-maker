import type { PromptTemplate, PromptVersion } from '~/server/db/types'

export interface TemplateWithVersionCount extends PromptTemplate {
  versionCount: number
  activeVersion: {
    id: number
    versionNumber: number
    createdAt: Date
  } | null
}

export interface TemplateWithVersions extends PromptTemplate {
  activeVersion:
    | (PromptVersion & {
        createdBy: { id: number; name: string } | null
      })
    | null
  versions: Array<{
    id: number
    versionNumber: number
    createdAt: Date
    createdBy: { id: number; name: string } | null
  }>
}

export const usePrompts = () => {
  const templates = ref<TemplateWithVersionCount[]>([])
  const currentTemplate = ref<TemplateWithVersions | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all templates
  const fetchTemplates = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch('/api/prompts')
      if (data.value) {
        templates.value = data.value.templates
      }
    } catch (e) {
      error.value = 'Failed to fetch templates'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Fetch single template
  const fetchTemplate = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch(`/api/prompts/${id}`)
      if (data.value) {
        currentTemplate.value = data.value as TemplateWithVersions
      }
    } catch (e) {
      error.value = 'Failed to fetch template'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Create new template
  const createTemplate = async (data: {
    scenarioType: string
    name: string
    description?: string
    initialContent: string
  }) => {
    loading.value = true
    try {
      const { data: result } = await useFetch('/api/prompts', {
        method: 'POST',
        body: data,
      })
      await fetchTemplates()
      return result.value
    } catch (e) {
      error.value = 'Failed to create template'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Create new version
  const createVersion = async (templateId: number, content: string) => {
    loading.value = true
    try {
      const { data } = await useFetch(`/api/prompts/${templateId}/versions`, {
        method: 'POST',
        body: { content },
      })
      await fetchTemplate(templateId)
      return data.value
    } catch (e) {
      error.value = 'Failed to create version'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Activate version
  const activateVersion = async (templateId: number, versionId: number) => {
    loading.value = true
    try {
      const { data } = await useFetch(`/api/prompts/${templateId}/activate`, {
        method: 'PUT',
        body: { versionId },
      })
      await fetchTemplate(templateId)
      return data.value
    } catch (e) {
      error.value = 'Failed to activate version'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Generate prompt using AI
  const generatePrompt = async (requirementDescription: string, scenarioType: string) => {
    loading.value = true
    try {
      const { data } = await useFetch('/api/prompts/generate', {
        method: 'POST',
        body: { requirementDescription, scenarioType },
      })
      return data.value as { generatedContent: string; suggestedVariables: string[] }
    } catch (e) {
      error.value = 'Failed to generate prompt'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    templates: readonly(templates),
    currentTemplate: readonly(currentTemplate),
    loading: readonly(loading),
    error: readonly(error),
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    createVersion,
    activateVersion,
    generatePrompt,
  }
}
