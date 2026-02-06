<template>
  <div class="prompt-editor">
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">系统 Prompt 模板编辑器</h3>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p class="text-blue-800 font-medium mb-2">可用变量：</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="variable in availableVariables"
            :key="variable"
            class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md cursor-pointer hover:bg-blue-200 transition-colors"
            @click="insertVariable(variable)"
          >
            <code class="text-xs">{{ '{' + '{' + variable + '}' + '}' }}</code>
          </span>
        </div>
      </div>
    </div>

    <div class="relative">
      <textarea
        ref="textareaRef"
        v-model="content"
        @input="handleInput"
        @keydown="handleKeydown"
        class="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="输入系统提示词模板，使用 {{variable}} 格式插入变量..."
      ></textarea>

      <!-- Variable highlighting overlay -->
      <div
        v-if="content"
        class="absolute inset-0 pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap break-words"
        style="overflow: hidden; height: 16rem"
      >
        <div v-html="highlightedContent"></div>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm text-gray-600">字符数: {{ content.length }}</div>
      <div class="flex gap-2">
        <button @click="previewPrompt" class="btn-secondary">预览效果</button>
        <button @click="resetContent" class="btn-secondary">重置</button>
      </div>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="showPreview"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showPreview = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Prompt 预览</h3>
        <div class="bg-gray-50 rounded-lg p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ renderedPrompt }}</pre>
        </div>
        <button @click="showPreview = false" class="mt-4 btn-primary">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'

  interface Props {
    modelValue: string
    variables?: Record<string, any>
  }

  const props = withDefaults(defineProps<Props>(), {
    variables: () => ({}),
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const textareaRef = ref<HTMLTextAreaElement>()
  const content = ref(props.modelValue)
  const showPreview = ref(false)

  const availableVariables = [
    'company_info',
    'accounts',
    'template_scenario',
    'user_input',
    'conversation_history',
  ]

  const highlightedContent = computed(() => {
    if (!content.value) return ''

    // Escape HTML
    let highlighted = content.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Highlight variables
    highlighted = highlighted.replace(
      /\{\{([^}]+)\}\}/g,
      '<span class="bg-blue-100 text-blue-800 px-1 rounded">{' + '{' + '$1' + '}' + '}</span>'
    )

    return highlighted
  })

  const renderedPrompt = computed(() => {
    if (!content.value) return ''

    let rendered = content.value

    // Replace variables with actual values
    Object.entries(props.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value || `[${key}]`))
    })

    return rendered
  })

  const handleInput = () => {
    emit('update:modelValue', content.value)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      // Emit save event if needed
    }

    // Tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault()
      const textarea = textareaRef.value
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const value = content.value

        content.value = value.substring(0, start) + '  ' + value.substring(end)

        nextTick(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        })
      }
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = content.value

    const variableText = `{{${variable}}}`
    content.value = value.substring(0, start) + variableText + value.substring(end)

    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variableText.length
      textarea.focus()
    })
  }

  const previewPrompt = () => {
    showPreview.value = true
  }

  const resetContent = () => {
    content.value = props.modelValue
  }

  // Watch for external changes
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue !== content.value) {
        content.value = newValue
      }
    }
  )
</script>

<style scoped>
  .prompt-editor {
    position: relative;
  }

  /* Ensure textarea is on top of overlay */
  .prompt-editor textarea {
    position: relative;
    z-index: 1;
    color: transparent;
    caret-color: #000;
  }

  .prompt-editor .absolute div {
    color: #000;
  }
</style>
