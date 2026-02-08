<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">编辑 Prompt 模板</h1>
        <p v-if="template" class="text-sm text-gray-500 mt-1">{{ template.name }} · {{ template.scenarioType }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="showAIChat = true" class="btn-secondary">AI 生成新版本</button>
        <NuxtLink to="/admin/prompts" class="btn-secondary">返回列表</NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8"><div class="text-gray-600">加载中...</div></div>
    <div v-else-if="error" class="text-center py-8 text-red-600">{{ error }}</div>

    <div v-else-if="template" class="flex gap-6">
      <!-- Left: Editor -->
      <div class="flex-1 min-w-0">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Prompt 内容</h2>
            <span class="text-sm text-gray-500">v{{ template.activeVersion?.versionNumber || '未激活' }}</span>
          </div>
          <textarea v-model="editContent" rows="28" class="input font-mono text-sm w-full" />
          <div class="flex gap-4 mt-4">
            <button @click="save" class="btn-primary" :disabled="saving || !hasChanges">
              {{ saving ? '保存中...' : '保存新版本' }}
            </button>
            <button @click="openPreview" class="btn-secondary">
              {{ previewLoading ? '预览中...' : '预览效果' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Version History -->
      <div class="w-80 shrink-0">
        <div class="card sticky top-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">版本历史</h2>
            <span class="text-xs text-gray-400">共 {{ template.versions?.length || 0 }} 个版本</span>
          </div>
          <div class="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div
              v-for="v in sortedVersions"
              :key="v.id"
              :class="[
                'border rounded-lg p-3 cursor-pointer transition-colors',
                template.activeVersion?.id === v.id
                  ? 'border-green-300 bg-green-50'
                  : selectedVersionId === v.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="loadVersion(v)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">v{{ v.versionNumber }}</span>
                  <span v-if="template.activeVersion?.id === v.id" class="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">当前</span>
                </div>
                <button
                  v-if="template.activeVersion?.id !== v.id"
                  @click.stop="activateV(v.id)"
                  class="text-xs text-blue-600 hover:text-blue-800"
                >激活</button>
              </div>
              <div class="text-xs text-gray-500 mt-1">{{ formatDate(v.createdAt) }}</div>
              <div v-if="v.changeDescription" class="text-xs text-gray-600 mt-1 line-clamp-2">{{ v.changeDescription }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Chat Modal -->
    <div v-if="showAIChat" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg w-full max-w-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">AI 生成助手</h2>
          <button @click="showAIChat = false" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div class="bg-gray-50 rounded p-3 mb-4 h-64 overflow-y-auto space-y-3">
          <div v-for="(msg, i) in chatMessages" :key="i" :class="msg.role === 'user' ? 'text-right' : 'text-left'">
            <span :class="msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'" class="inline-block px-3 py-2 rounded text-sm">{{ msg.content }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <input v-model="chatInput" @keyup.enter="sendChat" class="input flex-1 text-sm" placeholder="描述你想要的 Prompt..." />
          <button @click="sendChat" class="btn-primary" :disabled="chatting">发送</button>
        </div>
        <div class="mt-4 flex gap-2">
          <button v-if="generatedContent" @click="applyGenerated" class="btn-primary text-sm">应用生成内容</button>
          <button v-if="generatedContent" @click="compareWithCurrent" class="btn-secondary text-sm">对比当前</button>
        </div>
      </div>
    </div>

    <!-- Compare Modal -->
    <div v-if="showCompare" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-lg font-semibold mb-4">版本对比</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><h4 class="font-medium mb-2">当前版本</h4><pre class="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">{{ editContent }}</pre></div>
          <div><h4 class="font-medium mb-2 text-green-600">AI 生成</h4><pre class="bg-green-50 p-3 rounded text-xs overflow-auto max-h-96">{{ generatedContent }}</pre></div>
        </div>
        <div class="flex justify-end gap-4 mt-4">
          <button @click="showCompare = false" class="btn-secondary">取消</button>
          <button @click="applyGenerated" class="btn-primary">应用</button>
        </div>
      </div>
    </div>
    <!-- Preview Modal -->
    <div v-if="showPreviewModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-lg font-semibold mb-4">Prompt 预览效果</h3>
        <div v-if="previewLoading" class="text-center py-8">加载中...</div>
        <div v-else-if="previewResult" class="space-y-4">
          <div class="bg-gray-50 rounded p-4">
            <h4 class="font-medium mb-2 text-sm text-gray-600">渲染后内容</h4>
            <pre class="whitespace-pre-wrap text-sm">{{ previewResult.rendered }}</pre>
          </div>
          <div v-if="previewResult.usedVars.length" class="text-sm">
            <span class="text-green-600">已使用变量:</span> {{ previewResult.usedVars.join(', ') }}
          </div>
          <div v-if="previewResult.unrenderedVars.length" class="text-sm">
            <span class="text-yellow-600">未渲染变量:</span> {{ previewResult.unrenderedVars.join(', ') }}
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button @click="showPreviewModal = false" class="btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = parseInt(route.params.id as string, 10)
const { currentTemplate: template, loading, error, fetchTemplate, createVersion, activateVersion, generatePrompt } = usePrompts()
const { previewPrompt, previewLoading, previewResult } = usePromptPreview()

const editContent = ref('')
const originalContent = ref('')
const saving = ref(false)
const showAIChat = ref(false)
const chatMessages = ref([{role: 'assistant' as const, content: '你好！我是 Prompt 生成助手。请描述你想要的 Prompt 功能，我会帮你生成。'}])
const chatInput = ref('')
const chatting = ref(false)
const generatedContent = ref('')
const showCompare = ref(false)
const showPreviewModal = ref(false)
const selectedVersionId = ref<number | null>(null)

const hasChanges = computed(() => editContent.value !== originalContent.value)

const sortedVersions = computed(() => {
  if (!template.value?.versions) return []
  return [...template.value.versions].sort((a: any, b: any) => b.versionNumber - a.versionNumber)
})

function loadVersion(v: any) {
  selectedVersionId.value = v.id
  editContent.value = v.content
  originalContent.value = v.content
}

async function openPreview() {
  await previewPrompt(editContent.value)
  showPreviewModal.value = true
}

onMounted(async () => {
  await fetchTemplate(id)
  if (template.value?.activeVersion?.content) {
    editContent.value = template.value.activeVersion.content
    originalContent.value = template.value.activeVersion.content
  }
})

async function save() {
  if (!hasChanges.value) return
  saving.value = true
  try {
    await createVersion(id, editContent.value)
    originalContent.value = editContent.value
  } finally { saving.value = false }
}

async function activateV(versionId: number) {
  await activateVersion(id, versionId)
}

async function sendChat() {
  if (!chatInput.value.trim()) return
  chatting.value = true
  chatMessages.value.push({role: 'user', content: chatInput.value})
  const userMsg = chatInput.value
  chatInput.value = ''
  try {
    const result = await generatePrompt(userMsg, template.value?.scenarioType || 'scenario_analysis')
    if (result?.generatedContent) {
      generatedContent.value = result.generatedContent
      chatMessages.value.push({role: 'assistant', content: '已生成 Prompt，请查看右侧按钮操作。'})
    }
  } finally { chatting.value = false }
}

function applyGenerated() { editContent.value = generatedContent.value; showCompare.value = false }
function compareWithCurrent() { showCompare.value = true }
function formatDate(d: Date|string) { return new Date(d).toLocaleString('zh-CN') }
</script>
