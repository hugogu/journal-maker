<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">AI 配置</h1>
    
    <div class="card space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">AI 服务连接</h2>
        <span 
          :class="testStatus === 'connected' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-gray-500'"
          class="text-sm"
        >
          {{ testStatus === 'connected' ? '已连接' : testStatus === 'error' ? '连接失败' : '未测试' }}
        </span>
      </div>

      <form @submit.prevent="saveConfig" class="space-y-4">
        <div>
          <label class="label">API 端点</label>
          <input 
            v-model="config.apiEndpoint" 
            type="url" 
            class="input" 
            placeholder="https://api.openai.com/v1"
            required
          >
        </div>

        <div>
          <label class="label">API Key</label>
          <input 
            v-model="config.apiKey" 
            type="password" 
            class="input" 
            placeholder="sk-..."
            required
          >
        </div>

        <div>
          <label class="label">模型</label>
          <input 
            v-model="config.model" 
            type="text" 
            class="input" 
            placeholder="gpt-4, gpt-3.5-turbo, claude-3-opus, etc."
            required
          >
        </div>

        <div class="flex gap-4">
          <button 
            type="button" 
            class="btn-secondary"
            :disabled="testing"
            @click="testConnection"
          >
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="saving"
          >
            {{ saving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </form>
    </div>

    <div class="card mt-6 space-y-4">
      <h2 class="text-lg font-semibold">系统 Prompt 模板</h2>
      
      <div class="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
        <p class="text-gray-600">可用变量：</p>
        <code class="text-blue-600" v-pre>{{company_info}}</code>
        <code class="text-blue-600" v-pre>{{accounts}}</code>
        <code class="text-blue-600" v-pre>{{template_scenario}}</code>
      </div>

      <textarea 
        v-model="config.systemPrompt" 
        rows="10" 
        class="input font-mono text-sm"
        placeholder="输入系统提示词模板..."
      />

      <button 
        class="btn-primary"
        :disabled="savingPrompt"
        @click="savePrompt"
      >
        {{ savingPrompt ? '保存中...' : '保存 Prompt' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const config = ref({
  apiEndpoint: '',
  apiKey: '',
  model: 'gpt-4',
  systemPrompt: '',
})

const testing = ref(false)
const saving = ref(false)
const savingPrompt = ref(false)
const testStatus = ref<'idle' | 'connected' | 'error'>('idle')

onMounted(async () => {
  // Load existing config - find the active one
  const response = await $fetch<{ success: boolean; data: any[] }>('/api/ai-config')
  const activeConfig = response.data?.find((c: any) => c.isActive) || response.data?.[0]
  if (activeConfig) {
    config.value = {
      apiEndpoint: activeConfig.apiEndpoint,
      apiKey: activeConfig.apiKey,
      model: activeConfig.model,
      systemPrompt: activeConfig.systemPrompt,
    }
  }
})

async function testConnection() {
  testing.value = true
  try {
    await $fetch('/api/ai/test-connection', {
      method: 'POST',
      body: {
        apiEndpoint: config.value.apiEndpoint,
        apiKey: config.value.apiKey,
        model: config.value.model,
      },
    })
    testStatus.value = 'connected'
  } catch (e) {
    testStatus.value = 'error'
  } finally {
    testing.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await $fetch('/api/ai-config', {
      method: 'POST',
      body: config.value,
    })
    alert('配置已保存')
  } catch (e) {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

async function savePrompt() {
  savingPrompt.value = true
  try {
    await $fetch('/api/ai-config', {
      method: 'POST',
      body: config.value,
    })
    alert('Prompt 已保存')
  } catch (e) {
    alert('保存失败')
  } finally {
    savingPrompt.value = false
  }
}
</script>
