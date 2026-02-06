<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">编辑场景</h1>
      <NuxtLink :to="`/scenarios/${scenarioId}`" class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100" title="返回查看">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">加载中...</p>
    </div>

    <form v-else @submit.prevent="saveScenario" class="card space-y-4">
      <div>
        <label class="label">场景名称</label>
        <input 
          v-model="form.name" 
          type="text" 
          class="input"
          placeholder="输入场景名称"
          required
        />
      </div>

      <div>
        <label class="label">描述</label>
        <textarea 
          v-model="form.description" 
          rows="4" 
          class="input"
          placeholder="描述业务场景的背景、参与方、业务流程..."
        />
      </div>

      <div>
        <label class="label">状态</label>
        <select v-model="form.status" class="input">
          <option value="draft">草稿</option>
          <option value="confirmed">已确认</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <input 
          v-model="form.isTemplate" 
          type="checkbox" 
          id="isTemplate"
          class="w-4 h-4"
        />
        <label for="isTemplate" class="text-sm text-gray-700">设为模板</label>
      </div>

      <div class="flex gap-2 pt-4">
        <button 
          type="submit" 
          class="btn-primary"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <NuxtLink :to="`/scenarios/${scenarioId}`" class="btn-secondary">
          取消
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Scenario {
  id: number
  name: string
  description?: string
  status: string
  isTemplate?: boolean
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const scenarioId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const form = ref({
  name: '',
  description: '',
  status: 'draft',
  isTemplate: false
})

onMounted(async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Scenario }>(`/api/scenarios/${scenarioId}`)
    if (response.success) {
      const scenario = response.data
      form.value = {
        name: scenario.name,
        description: scenario.description || '',
        status: scenario.status,
        isTemplate: scenario.isTemplate || false
      }
    }
  } catch (e) {
    console.error('Failed to load scenario:', e)
    alert('加载失败')
  } finally {
    loading.value = false
  }
})

async function saveScenario() {
  saving.value = true
  try {
    await $fetch(`/api/scenarios/${scenarioId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        description: form.value.description,
        status: form.value.status,
        isTemplate: form.value.isTemplate
      }
    })
    router.back()
  } catch (e) {
    console.error('Failed to update scenario:', e)
  } finally {
    saving.value = false
  }
}
</script>
