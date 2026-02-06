<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">AI Provider 管理</h1>
      <button @click="showCreateModal = true" class="btn-primary">添加 Provider</button>
    </div>

    <div v-if="loading" class="text-center py-8"><div class="text-gray-600">加载中...</div></div>
    <div v-else-if="error" class="text-center py-8 text-red-600">{{ error }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="provider in providers" :key="provider.id" class="card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold">{{ provider.name }}</h3>
            <span v-if="provider.isDefault" class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">默认</span>
            <span :class="provider.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-1 text-xs rounded">
              {{ provider.status === 'active' ? '启用' : '禁用' }}
            </span>
          </div>
          <div class="flex gap-2">
            <button @click="editProvider(provider)" class="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
            <button @click="deleteProvider(provider.id)" class="text-red-600 hover:text-red-800 text-sm">删除</button>
          </div>
        </div>
        <div class="space-y-2 text-sm text-gray-600">
          <div><span class="font-medium">类型:</span> {{ provider.type }}</div>
          <div><span class="font-medium">端点:</span> {{ provider.apiEndpoint }}</div>
          <div><span class="font-medium">默认模型:</span> {{ provider.defaultModel || '未设置' }}</div>
          <div><span class="font-medium">模型数:</span> {{ provider.models?.length || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingProvider" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 class="text-lg font-semibold mb-4">{{ editingProvider ? '编辑 Provider' : '添加 Provider' }}</h3>
        <form @submit.prevent="saveProvider" class="space-y-4">
          <div>
            <label class="label">名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">类型 <span class="text-red-500">*</span></label>
            <select v-model="form.type" class="input" required>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
              <option value="ollama">Ollama</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label class="label">API 端点 <span class="text-red-500">*</span></label>
            <input v-model="form.apiEndpoint" type="url" class="input" placeholder="https://api.openai.com/v1" required />
          </div>
          <div>
            <label class="label">API Key {{ editingProvider ? '(留空则不修改)' : '*' }}</label>
            <input v-model="form.apiKey" type="password" class="input" placeholder="sk-..." :required="!editingProvider" />
          </div>
          <div>
            <label class="label">默认模型 <span class="text-red-500">*</span></label>
            <input v-model="form.defaultModel" type="text" class="input" placeholder="gpt-4, gpt-3.5-turbo..." required />
            <p class="text-xs text-gray-500 mt-1">用于测试连接和分析时使用的默认模型</p>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <input v-model="form.isDefault" type="checkbox" id="isDefault" />
              <label for="isDefault">设为默认 Provider</label>
            </div>
            <button 
              type="button" 
              @click="testConnection" 
              :disabled="testing" 
              class="flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors"
              :class="{
                'text-blue-600 hover:text-blue-800 hover:bg-blue-50': !testResult,
                'text-green-600 bg-green-50': testResult && testSuccess,
                'text-red-600 bg-red-50': testResult && !testSuccess,
                'opacity-50 cursor-not-allowed': testing
              }"
            >
              <svg v-if="testing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <svg v-else-if="testResult && testSuccess" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <svg v-else-if="testResult && !testSuccess" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              {{ testing ? '测试中...' : testResult ? (testSuccess ? '连接成功' : '连接失败') : '测试连接' }}
            </button>
          </div>
          <div class="flex gap-4 pt-4">
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
            <button type="button" @click="closeModal" class="btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { providers, loading, error, fetchProviders, createProvider, updateProvider, deleteProvider: delProvider } = useAIProviders()

const showCreateModal = ref(false)
const editingProvider = ref<any>(null)
const saving = ref(false)
const testing = ref(false)
const testResult = ref(false)
const testSuccess = ref(false)
const form = reactive({
  name: '',
  type: 'openai' as const,
  apiEndpoint: '',
  apiKey: '',
  defaultModel: 'gpt-4',
  isDefault: false
})

onMounted(fetchProviders)

function editProvider(provider: any) {
  editingProvider.value = provider
  form.name = provider.name
  form.type = provider.type
  form.apiEndpoint = provider.apiEndpoint
  form.apiKey = '' // Don't show existing key
  form.defaultModel = provider.defaultModel || 'gpt-4'
  form.isDefault = provider.isDefault
  testResult.value = false
}

function closeModal() {
  showCreateModal.value = false
  editingProvider.value = null
  form.name = ''
  form.type = 'openai'
  form.apiEndpoint = ''
  form.apiKey = ''
  form.defaultModel = 'gpt-4'
  form.isDefault = false
  testResult.value = false
  testSuccess.value = false
}

async function testConnection() {
  testing.value = true
  testResult.value = false
  try {
    const body: any = {
      providerType: form.type,
      apiEndpoint: form.apiEndpoint,
      model: form.defaultModel
    }
    
    // If editing and apiKey is empty, pass providerId to use stored key
    if (editingProvider.value && !form.apiKey) {
      body.providerId = editingProvider.value.id
    } else {
      body.apiKey = form.apiKey
    }
    
    const result = await $fetch('/api/ai/test-connection', {
      method: 'POST',
      body
    })
    testSuccess.value = true
  } catch (e: any) {
    testSuccess.value = false
  } finally {
    testing.value = false
    testResult.value = true
  }
}

async function saveProvider() {
  saving.value = true
  try {
    if (editingProvider.value) {
      await updateProvider(editingProvider.value.id, { ...form })
    } else {
      await createProvider({ ...form })
    }
    closeModal()
  } finally {
    saving.value = false
  }
}

async function deleteProvider(id: number) {
  if (!confirm('确定要删除这个 Provider 吗？')) return
  await delProvider(id)
}
</script>
