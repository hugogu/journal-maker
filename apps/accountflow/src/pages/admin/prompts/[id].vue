<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">编辑 Prompt 模板</h1>
      <NuxtLink to="/admin/prompts" class="btn-secondary">
        返回列表
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="text-gray-600">加载中...</div>
    </div>

    <div v-else-if="error" class="text-center py-8 text-red-600">
      {{ error }}
    </div>

    <div v-else-if="template" class="space-y-6">
      <!-- Template Info -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">模板信息</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">场景类型</label>
            <div class="px-3 py-2 bg-gray-100 rounded">
              {{ formatScenarioType(template.scenarioType) }}
            </div>
          </div>
          <div>
            <label class="label">当前版本</label>
            <div class="px-3 py-2 bg-gray-100 rounded">
              <span v-if="template.activeVersion" class="text-green-600">
                v{{ template.activeVersion.versionNumber }}
              </span>
              <span v-else class="text-gray-400">未激活</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Version List -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">版本历史</h2>
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 px-4">版本号</th>
              <th class="text-left py-2 px-4">创建时间</th>
              <th class="text-left py-2 px-4">创建者</th>
              <th class="text-right py-2 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="version in template.versions" :key="version.id" class="border-b">
              <td class="py-2 px-4">
                <span v-if="template.activeVersion?.id === version.id" class="text-green-600 font-medium">
                  v{{ version.versionNumber }} (当前)
                </span>
                <span v-else>v{{ version.versionNumber }}</span>
              </td>
              <td class="py-2 px-4 text-gray-600">{{ formatDate(version.createdAt) }}</td>
              <td class="py-2 px-4">{{ version.createdBy?.name || '-' }}</td>
              <td class="py-2 px-4 text-right">
                <button 
                  v-if="template.activeVersion?.id !== version.id"
                  @click="activateVersion(version.id)"
                  class="text-blue-600 hover:text-blue-800"
                  :disabled="activating"
                >
                  激活
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create New Version -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">创建新版本</h2>
        <div class="space-y-4">
          <textarea
            v-model="newVersionContent"
            rows="10"
            class="input font-mono text-sm"
            placeholder="输入 Prompt 内容..."
          />
          <div class="flex gap-4">
            <button 
              @click="createVersion"
              class="btn-primary"
              :disabled="!newVersionContent || creating"
            >
              {{ creating ? '创建中...' : '创建版本' }}
            </button>
            <button 
              @click="showGenerateModal = true"
              class="btn-secondary"
            >
              AI 生成
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Generate Modal -->
  <div v-if="showGenerateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
      <h3 class="text-lg font-semibold mb-4">AI 生成 Prompt</h3>
      <textarea
        v-model="generateDescription"
        rows="4"
        class="input mb-4"
        placeholder="描述你想要的 Prompt 功能..."
      />
      <div class="flex justify-end gap-4">
        <button @click="showGenerateModal = false" class="btn-secondary">取消</button>
        <button 
          @click="generatePrompt" 
          class="btn-primary"
          :disabled="!generateDescription || generating"
        >
          {{ generating ? '生成中...' : '生成' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = parseInt(route.params.id as string, 10)

const { currentTemplate: template, loading, error, fetchTemplate, createVersion: createNewVersion, activateVersion: activate, generatePrompt: generate } = usePrompts()

const newVersionContent = ref('')
const creating = ref(false)
const activating = ref(false)
const showGenerateModal = ref(false)
const generateDescription = ref('')
const generating = ref(false)

onMounted(() => {
  fetchTemplate(id)
})

async function createVersion() {
  creating.value = true
  try {
    await createNewVersion(id, newVersionContent.value)
    newVersionContent.value = ''
  } finally {
    creating.value = false
  }
}

async function activateVersion(versionId: number) {
  activating.value = true
  try {
    await activate(id, versionId)
  } finally {
    activating.value = false
  }
}

async function generatePrompt() {
  generating.value = true
  try {
    const result = await generate(generateDescription.value, template.value?.scenarioType || 'scenario_analysis')
    if (result) {
      newVersionContent.value = result.generatedContent
      showGenerateModal.value = false
      generateDescription.value = ''
    }
  } finally {
    generating.value = false
  }
}

function formatScenarioType(type: string): string {
  const map: Record<string, string> = {
    'scenario_analysis': '场景分析',
    'sample_generation': '示例生成',
    'prompt_generation': 'Prompt生成',
    'flowchart_generation': '流程图生成'
  }
  return map[type] || type
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('zh-CN')
}
</script>
