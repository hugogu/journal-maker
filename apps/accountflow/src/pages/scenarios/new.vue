<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">新建场景</h1>
    
    <form @submit.prevent="createScenario" class="card space-y-6">
      <div>
        <label class="label">场景名称</label>
        <input 
          v-model="form.name" 
          type="text" 
          class="input" 
          placeholder="例如：电商订单退款流程"
          required
        >
      </div>

      <div>
        <label class="label">场景描述</label>
        <textarea 
          v-model="form.description" 
          rows="4" 
          class="input" 
          placeholder="描述业务场景的背景、参与方、业务流程..."
        />
      </div>

      <div class="flex items-center gap-2">
        <input 
          id="isTemplate" 
          v-model="form.isTemplate" 
          type="checkbox"
          class="w-4 h-4"
        >
        <label for="isTemplate" class="text-sm text-gray-700">
          设为模板场景（作为AI分析的范例）
        </label>
      </div>

      <div class="flex gap-4">
        <NuxtLink to="/scenarios" class="btn-secondary flex-1 text-center">
          取消
        </NuxtLink>
        <button 
          type="submit" 
          class="btn-primary flex-1"
          :disabled="saving"
        >
          {{ saving ? '创建中...' : '创建场景' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '~/composables/useToast'

const router = useRouter()
const toast = useToast()

const form = ref({
  name: '',
  description: '',
  isTemplate: false,
})

const saving = ref(false)

async function createScenario() {
  saving.value = true
  try {
    const response = await $fetch('/api/scenarios', {
      method: 'POST',
      body: form.value,
    })

    if (response.success) {
      toast.success('场景创建成功')
      router.push(`/scenarios/${response.data.id}/analyze`)
    }
  } catch (e: any) {
    console.error('Failed to create scenario:', e)
    toast.error(e?.data?.message || '创建失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>
