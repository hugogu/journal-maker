import type { CompanyProfile } from '~/server/db/types'

export const useCompanyProfile = () => {
  const profile = ref<CompanyProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch('/api/company-profile')
      if (data.value?.profile) {
        profile.value = data.value.profile
      }
    } catch (e: any) {
      error.value = e?.data?.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  const saveProfile = async (data: {
    name: string
    businessModel?: string | null
    industry?: string | null
    accountingPreference?: string | null
    notes?: string | null
  }) => {
    loading.value = true
    error.value = null
    try {
      const { data: result } = await useFetch('/api/company-profile', {
        method: 'POST',
        body: data
      })
      if (result.value?.profile) {
        profile.value = result.value.profile
        return result.value.profile
      }
    } catch (e: any) {
      error.value = e?.data?.message || '保存失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    error: readonly(error),
    fetchProfile,
    saveProfile
  }
}
