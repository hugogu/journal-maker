<template>
  <div class="system-preferences">
    <h3 class="text-lg font-semibold mb-4">体系偏好设置</h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">加载中...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Preferences Form -->
    <div v-else class="space-y-6">
      <!-- Common Preferences -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-700 mb-3">通用设置</h4>
        <div class="space-y-4">
          <!-- Recognition Criteria -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              收入确认标准
            </label>
            <select
              v-model="preferences.recognition_criteria"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="accrual">权责发生制</option>
              <option value="cash">收付实现制</option>
              <option value="hybrid">混合制</option>
            </select>
          </div>

          <!-- Timing Rules -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              记账时点规则
            </label>
            <select
              v-model="preferences.timing_rules"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="strict">严格时点</option>
              <option value="flexible">灵活时点</option>
              <option value="end_of_period">期末统一</option>
            </select>
          </div>

          <!-- Policy Flags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              政策选项
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="preferences.policy_flags.use_historical_cost"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-600">使用历史成本法</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="preferences.policy_flags.separate_by_nature"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-600">按性质分类</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="preferences.policy_flags.show_intermediate"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-600">显示中间科目</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Preferences -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-700 mb-3">自定义设置</h4>
        <div class="space-y-3">
          <div
            v-for="(value, key) in customPreferences"
            :key="key"
            class="flex items-center gap-3"
          >
            <input
              type="text"
              v-model="customKeys[key]"
              placeholder="设置键名"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              v-model="customValues[key]"
              placeholder="设置值"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              @click="removeCustomPreference(key)"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Icon name="delete" class="w-4 h-4" />
            </button>
          </div>
          <button
            @click="addCustomPreference"
            class="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Icon name="plus" class="w-4 h-4" />
            添加自定义设置
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-4 border-t">
        <button
          @click="savePreferences"
          :disabled="isSaving"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Icon v-if="isSaving" name="loading" class="w-4 h-4 animate-spin" />
          <Icon v-else name="save" class="w-4 h-4" />
          {{ isSaving ? '保存中...' : '保存设置' }}
        </button>
        <button
          @click="resetPreferences"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          重置
        </button>
      </div>

      <!-- Success Message -->
      <div
        v-if="showSuccess"
        class="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 flex items-center gap-2"
      >
        <Icon name="check" class="w-4 h-4" />
        设置已保存
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const props = defineProps<{
  systemId: number
}>()

interface Preferences {
  recognition_criteria: string
  timing_rules: string
  policy_flags: {
    use_historical_cost: boolean
    separate_by_nature: boolean
    show_intermediate: boolean
  }
}

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)

const preferences = reactive<Preferences>({
  recognition_criteria: 'accrual',
  timing_rules: 'strict',
  policy_flags: {
    use_historical_cost: true,
    separate_by_nature: false,
    show_intermediate: true,
  },
})

const customPreferences = reactive<Record<string, string>>({})
const customKeys = reactive<Record<string, string>>({})
const customValues = reactive<Record<string, string>>({})

onMounted(async () => {
  await loadPreferences()
})

async function loadPreferences() {
  isLoading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await useFetch(`/api/systems/${props.systemId}/preferences`)

    if (fetchError.value) {
      throw new Error(fetchError.value.message || 'Failed to load preferences')
    }

    if (data.value?.data?.preferences) {
      const prefs = data.value.data.preferences

      // Set common preferences
      if (prefs.recognition_criteria) {
        preferences.recognition_criteria = prefs.recognition_criteria
      }
      if (prefs.timing_rules) {
        preferences.timing_rules = prefs.timing_rules
      }
      if (prefs.policy_flags) {
        Object.assign(preferences.policy_flags, prefs.policy_flags)
      }

      // Set custom preferences
      const commonKeys = ['recognition_criteria', 'timing_rules', 'policy_flags']
      for (const [key, value] of Object.entries(prefs)) {
        if (!commonKeys.includes(key)) {
          customPreferences[key] = String(value)
          customKeys[key] = key
          customValues[key] = String(value)
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || '加载偏好设置失败'
    console.error('Failed to load preferences:', err)
  } finally {
    isLoading.value = false
  }
}

async function savePreferences() {
  isSaving.value = true
  error.value = null
  showSuccess.value = false

  try {
    // Build preferences object
    const prefsToSave: Record<string, any> = {
      recognition_criteria: preferences.recognition_criteria,
      timing_rules: preferences.timing_rules,
      policy_flags: preferences.policy_flags,
    }

    // Add custom preferences
    for (const key of Object.keys(customPreferences)) {
      const actualKey = customKeys[key] || key
      const value = customValues[key]
      if (actualKey && value !== undefined) {
        // Try to parse as JSON, fallback to string
        try {
          prefsToSave[actualKey] = JSON.parse(value)
        } catch {
          prefsToSave[actualKey] = value
        }
      }
    }

    const { error: saveError } = await useFetch(`/api/systems/${props.systemId}/preferences`, {
      method: 'PUT',
      body: { preferences: prefsToSave },
    })

    if (saveError.value) {
      throw new Error(saveError.value.message || 'Failed to save preferences')
    }

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.message || '保存偏好设置失败'
    console.error('Failed to save preferences:', err)
  } finally {
    isSaving.value = false
  }
}

function resetPreferences() {
  preferences.recognition_criteria = 'accrual'
  preferences.timing_rules = 'strict'
  preferences.policy_flags = {
    use_historical_cost: true,
    separate_by_nature: false,
    show_intermediate: true,
  }
  Object.keys(customPreferences).forEach(key => {
    delete customPreferences[key]
    delete customKeys[key]
    delete customValues[key]
  })
}

function addCustomPreference() {
  const key = `custom_${Date.now()}`
  customPreferences[key] = ''
  customKeys[key] = ''
  customValues[key] = ''
}

function removeCustomPreference(key: string) {
  delete customPreferences[key]
  delete customKeys[key]
  delete customValues[key]
}
</script>

<style scoped>
.system-preferences {
  @apply w-full;
}
</style>
