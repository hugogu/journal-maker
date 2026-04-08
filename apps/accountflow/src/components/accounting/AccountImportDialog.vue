<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">导入科目</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Step 1: File Upload -->
      <div v-if="step === 'upload'" class="space-y-4">
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
             :class="{ 'border-blue-400 bg-blue-50': isDragging }"
             @dragover.prevent="isDragging = true"
             @dragleave.prevent="isDragging = false"
             @drop.prevent="handleDrop">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p class="text-gray-600 mb-2">拖拽文件到此处，或</p>
          <input ref="fileInput" type="file" accept=".json,.csv" class="hidden" @change="handleFileSelect">
          <button @click="triggerFileInput" class="text-blue-600 hover:text-blue-700 font-medium">
            点击选择文件
          </button>
          <p class="text-gray-400 text-sm mt-2">支持 JSON 或 CSV 格式</p>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">数据格式示例（CSV）：</h3>
          <pre class="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto">code,name,type,direction,description,isActive,systems
1001,库存现金,asset,debit,企业持有的现金,true,小企业会计准则
1002,银行存款,asset,debit,企业存入银行的款项,true,小企业会计准则,企业会计准则</pre>
          <p class="text-xs text-gray-500 mt-2">
            type: asset/liability/equity/revenue/expense | 
            direction: debit/credit/both
          </p>
        </div>
      </div>

      <!-- Step 2: Preview & Conflict Resolution -->
      <div v-else-if="step === 'preview'" class="flex-1 overflow-hidden flex flex-col">
        <!-- Summary -->
        <div class="flex gap-4 mb-4">
          <div class="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="text-2xl font-bold text-green-600">{{ summary.new }}</div>
            <div class="text-sm text-green-700">新增科目</div>
          </div>
          <div class="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div class="text-2xl font-bold text-yellow-600">{{ summary.conflicts }}</div>
            <div class="text-sm text-yellow-700">冲突科目</div>
          </div>
          <div class="flex-1 bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="text-2xl font-bold text-red-600">{{ summary.invalid }}</div>
            <div class="text-sm text-red-700">无效数据</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-4 border-b">
          <button 
            v-if="preview.new.length > 0"
            @click="activeTab = 'new'"
            :class="{ 'border-b-2 border-blue-500 text-blue-600': activeTab === 'new' }"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            新增 ({{ preview.new.length }})
          </button>
          <button 
            v-if="preview.conflicts.length > 0"
            @click="activeTab = 'conflicts'"
            :class="{ 'border-b-2 border-blue-500 text-blue-600': activeTab === 'conflicts' }"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            冲突 ({{ preview.conflicts.length }})
          </button>
          <button 
            v-if="preview.invalid.length > 0"
            @click="activeTab = 'invalid'"
            :class="{ 'border-b-2 border-blue-500 text-blue-600': activeTab === 'invalid' }"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            无效 ({{ preview.invalid.length }})
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto">
          <!-- New Accounts -->
          <div v-if="activeTab === 'new'" class="space-y-2">
            <div v-for="item in preview.new" :key="item.index" 
                 class="border rounded-lg p-3 hover:bg-gray-50">
              <div class="flex items-center justify-between mb-2">
                <span class="font-mono font-medium text-blue-600">{{ item.code }}</span>
                <span class="text-sm text-gray-500">第 {{ item.index + 1 }} 行</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-500">名称:</span> {{ item.data.name }}</div>
                <div><span class="text-gray-500">类型:</span> {{ typeText(item.data.type) }}</div>
                <div><span class="text-gray-500">方向:</span> {{ directionText(item.data.direction) }}</div>
                <div><span class="text-gray-500">体系:</span> {{ item.data.systems || '-' }}</div>
              </div>
              <div v-if="item.invalidSystems?.length" class="mt-2 text-sm text-red-600">
                ⚠️ 不存在的体系: {{ item.invalidSystems.join(', ') }}
              </div>
            </div>
          </div>

          <!-- Conflicts -->
          <div v-if="activeTab === 'conflicts'" class="space-y-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-yellow-800">
                以下科目代码已存在于系统中，但数据有所不同。请选择要保留的数据版本。
              </p>
            </div>

            <div v-for="item in preview.conflicts" :key="item.index" class="border rounded-lg overflow-hidden">
              <!-- Conflict Header -->
              <div class="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                <span class="font-mono font-medium">{{ item.code }}</span>
                <div class="flex gap-2">
                  <button 
                    @click="resolveConflict(item.index, 'keep-existing')"
                    :class="{ 'bg-blue-100 text-blue-700': conflictResolutions[item.index] === 'keep-existing' }"
                    class="px-3 py-1 text-xs rounded border hover:bg-gray-100">
                    保留现有
                  </button>
                  <button 
                    @click="resolveConflict(item.index, 'use-import')"
                    :class="{ 'bg-blue-100 text-blue-700': conflictResolutions[item.index] === 'use-import' }"
                    class="px-3 py-1 text-xs rounded border hover:bg-gray-100">
                    使用导入
                  </button>
                  <button 
                    @click="resolveConflict(item.index, 'skip')"
                    :class="{ 'bg-gray-100 text-gray-600': conflictResolutions[item.index] === 'skip' }"
                    class="px-3 py-1 text-xs rounded border hover:bg-gray-100">
                    跳过
                  </button>
                </div>
              </div>

              <!-- Comparison Table -->
              <div class="grid grid-cols-2 gap-0 divide-x">
                <div class="p-3" :class="{ 'bg-red-50': conflictResolutions[item.index] === 'use-import' }">
                  <div class="text-xs font-medium text-gray-500 mb-2">现有数据</div>
                  <div class="space-y-1 text-sm">
                    <div :class="{ 'bg-red-100': item.differences.includes('name') }">
                      <span class="text-gray-500">名称:</span> {{ item.existingData.name }}
                    </div>
                    <div :class="{ 'bg-red-100': item.differences.includes('type') }">
                      <span class="text-gray-500">类型:</span> {{ typeText(item.existingData.type) }}
                    </div>
                    <div :class="{ 'bg-red-100': item.differences.includes('direction') }">
                      <span class="text-gray-500">方向:</span> {{ directionText(item.existingData.direction) }}
                    </div>
                    <div :class="{ 'bg-red-100': item.differences.includes('description') }">
                      <span class="text-gray-500">说明:</span> {{ item.existingData.description || '-' }}
                    </div>
                  </div>
                </div>
                <div class="p-3" :class="{ 'bg-green-50': conflictResolutions[item.index] === 'use-import' }">
                  <div class="text-xs font-medium text-gray-500 mb-2">导入数据</div>
                  <div class="space-y-1 text-sm">
                    <div :class="{ 'bg-green-100': item.differences.includes('name') }">
                      <span class="text-gray-500">名称:</span> {{ item.importData.name }}
                    </div>
                    <div :class="{ 'bg-green-100': item.differences.includes('type') }">
                      <span class="text-gray-500">类型:</span> {{ typeText(item.importData.type) }}
                    </div>
                    <div :class="{ 'bg-green-100': item.differences.includes('direction') }">
                      <span class="text-gray-500">方向:</span> {{ directionText(item.importData.direction) }}
                    </div>
                    <div :class="{ 'bg-green-100': item.differences.includes('description') }">
                      <span class="text-gray-500">说明:</span> {{ item.importData.description || '-' }}
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="item.invalidSystems?.length" class="px-4 py-2 bg-red-50 border-t text-sm text-red-600">
                ⚠️ 导入数据中包含不存在的体系: {{ item.invalidSystems.join(', ') }}
              </div>
            </div>
          </div>

          <!-- Invalid -->
          <div v-if="activeTab === 'invalid'" class="space-y-2">
            <div v-for="item in preview.invalid" :key="item.index" class="border border-red-200 rounded-lg p-3 bg-red-50">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-red-600">第 {{ item.index + 1 }} 行</span>
              </div>
              <pre class="text-xs text-gray-600 bg-white p-2 rounded mb-2">{{ JSON.stringify(item.data, null, 2) }}</pre>
              <div class="text-sm text-red-600">{{ item.error }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between pt-4 border-t mt-4">
          <button @click="step = 'upload'" class="btn-secondary">
            返回上传
          </button>
          <div class="flex gap-2">
            <button @click="close" class="btn-secondary">取消</button>
            <button 
              @click="confirmImport"
              :disabled="!canImport || importing"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': !canImport || importing }">
              {{ importing ? '导入中...' : '确认导入' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Result -->
      <div v-else-if="step === 'result'" class="text-center py-8">
        <div class="mb-4">
          <svg v-if="result.success" class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg v-else class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium mb-2">{{ result.success ? '导入成功' : '导入失败' }}</h3>
        <div v-if="result.success" class="space-y-2 text-sm text-gray-600 mb-6">
          <p>成功创建 {{ result.summary.created }} 个科目</p>
          <p>成功更新 {{ result.summary.updated }} 个科目</p>
          <p v-if="result.summary.errors > 0" class="text-red-600">{{ result.summary.errors }} 个错误</p>
        </div>
        <p v-else class="text-red-600 mb-6">{{ result.error }}</p>
        <button @click="closeAndRefresh" class="btn-primary">完成</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const step = ref<'upload' | 'preview' | 'result'>('upload')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const importing = ref(false)
const activeTab = ref<'new' | 'conflicts' | 'invalid'>('new')

const preview = ref({
  new: [] as any[],
  conflicts: [] as any[],
  invalid: [] as any[],
})

const summary = ref({
  total: 0,
  new: 0,
  conflicts: 0,
  invalid: 0,
})

const conflictResolutions = ref<Record<number, 'keep-existing' | 'use-import' | 'skip'>>({})

const result = ref({
  success: false,
  summary: { created: 0, updated: 0, errors: 0 },
  error: '',
})

const canImport = computed(() => {
  const hasNew = preview.value.new.length > 0
  const hasResolvedConflicts = preview.value.conflicts.every(
    c => conflictResolutions.value[c.index]
  )
  return hasNew || (preview.value.conflicts.length > 0 && hasResolvedConflicts)
})

function close() {
  emit('close')
  reset()
}

function closeAndRefresh() {
  emit('success')
  close()
}

function reset() {
  step.value = 'upload'
  preview.value = { new: [], conflicts: [], invalid: [] }
  summary.value = { total: 0, new: 0, conflicts: 0, invalid: 0 }
  conflictResolutions.value = {}
  result.value = { success: false, summary: { created: 0, updated: 0, errors: 0 }, error: '' }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    processFile(files[0])
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file: File) {
  try {
    const text = await file.text()
    let data: any[]

    if (file.name.endsWith('.csv')) {
      data = parseCSV(text)
    } else {
      data = JSON.parse(text)
    }

    if (!Array.isArray(data)) {
      alert('文件格式错误：数据必须是数组')
      return
    }

    // Call preview API
    const response: any = await $fetch('/api/accounts/import/preview', {
      method: 'POST',
      body: { accounts: data },
    })

    if (response.success) {
      preview.value = response.data.preview
      summary.value = response.data.summary
      
      // Set default active tab
      if (preview.value.new.length > 0) {
        activeTab.value = 'new'
      } else if (preview.value.conflicts.length > 0) {
        activeTab.value = 'conflicts'
      } else if (preview.value.invalid.length > 0) {
        activeTab.value = 'invalid'
      }
      
      step.value = 'preview'
    } else {
      alert(response.error || '预览失败')
    }
  } catch (error) {
    console.error('File processing error:', error)
    alert('文件处理失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const result = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const obj: any = {}
    headers.forEach((header, index) => {
      let value: any = values[index] || ''
      
      // Convert boolean strings
      if (value === 'true') value = true
      if (value === 'false') value = false
      
      obj[header] = value
    })
    result.push(obj)
  }

  return result
}

function resolveConflict(index: number, resolution: 'keep-existing' | 'use-import' | 'skip') {
  conflictResolutions.value[index] = resolution
}

async function confirmImport() {
  importing.value = true

  try {
    // Prepare data for import
    const newAccounts = preview.value.new
      .filter(item => !item.invalidSystems?.length)

    const updates = preview.value.conflicts
      .filter(item => conflictResolutions.value[item.index] === 'use-import')
      .map(item => ({
        existingId: item.existingId,
        data: item.importData,
      }))

    const response: any = await $fetch('/api/accounts/import/confirm', {
      method: 'POST',
      body: { new: newAccounts, updates },
    })

    if (response.success) {
      result.value = {
        success: true,
        summary: response.data.summary,
        error: '',
      }
    } else {
      result.value = {
        success: false,
        summary: { created: 0, updated: 0, errors: 0 },
        error: response.error || '导入失败',
      }
    }
  } catch (error) {
    result.value = {
      success: false,
      summary: { created: 0, updated: 0, errors: 0 },
      error: error instanceof Error ? error.message : '导入失败',
    }
  } finally {
    importing.value = false
    step.value = 'result'
  }
}

function typeText(type: string) {
  const map: Record<string, string> = {
    asset: '资产',
    liability: '负债',
    equity: '权益',
    revenue: '收入',
    expense: '费用',
  }
  return map[type] || type
}

function directionText(dir: string) {
  const map: Record<string, string> = {
    debit: '借方',
    credit: '贷方',
    both: '双向',
  }
  return map[dir] || dir
}
</script>
