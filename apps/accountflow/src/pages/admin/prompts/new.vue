<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">新建 Prompt 模板</h1>
      <NuxtLink to="/admin/prompts" class="btn-secondary">
        返回列表
      </NuxtLink>
    </div>

    <form @submit.prevent="handleSubmit" class="card space-y-6">
      <div>
        <label class="label">场景类型 <span class="text-red-500">*</span></label>
        <select v-model="form.scenarioType" class="input" required>
          <option value="scenario_analysis">场景分析</option>
          <option value="sample_generation">示例生成</option>
          <option value="prompt_generation">Prompt生成</option>
          <option value="flowchart_generation">流程图生成</option>
        </select>
      </div>

      <div>
        <label class="label">名称 <span class="text-red-500">*</span></label>
        <input v-model="form.name" type="text" class="input" placeholder="输入模板名称" required />
      </div>

      <div>
        <label class="label">描述</label>
        <textarea v-model="form.description" rows="2" class="input" placeholder="输入模板描述（可选）" />
      </div>

      <div>
        <label class="label">初始内容 <span class="text-red-500">*</span></label>
        <div class="flex gap-4 mb-2">
          <button type="button" @click="showGenerateModal = true" class="text-sm text-blue-600 hover:text-blue-800">
            🤖 AI 生成
          </button>
        </div>
        <textarea v-model="form.initialContent" rows="12" class="input font-mono text-sm" placeholder="输入 Prompt 内容..." required />
        <p class="text-xs text-gray-500 mt-1">使用 {{variableName}} 语法定义变量</p>
      </div>

      <div class="flex gap-4 pt-4">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? '创建中...' : '创建模板' }}
        </button>
        <NuxtLink to="/admin/prompts" class="btn-secondary">取消</NuxtLink>
      </div>
    </form>

    <!-- Generate Modal -->
    <div v-if="showGenerateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { createTemplate, generatePrompt: generate } = usePrompts()

const form = reactive({
  scenarioType: 'scenario_analysis',
  name: '',
  description: '',
  initialContent: ''
})

const submitting = ref(false)
const showGenerateModal = ref(false)
const generateDescription = ref('')
const generating = ref(false)

async function handleSubmit() {
  submitting.value = true
  try {
    const result = await createTemplate({
      scenarioType: form.scenarioType,
      name: form.name,
      description: form.description,
      initialContent: form.initialContent
    })
    if (result?.template?.id) {
      router.push(`/admin/prompts/${result.template.id}`)
    }
  } finally {
    submitting.value = false
  }
}

async function generatePrompt() {
  generating.value = true
  try {
    const result = await generate(generateDescription.value, form.scenarioType)
    if (result) {
      form.initialContent = result.generatedContent
      showGenerateModal.value = false
      generateDescription.value = ''
    }
  } finally {
    generating.value = false
  }
}
</script>
