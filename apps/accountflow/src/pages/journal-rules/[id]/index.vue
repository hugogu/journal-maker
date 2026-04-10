<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <p class="text-gray-500">{{ error }}</p>
      <button @click="router.back()" class="mt-4 text-blue-600 hover:text-blue-700">
        返回列表
      </button>
    </div>

    <!-- Rule Detail -->
    <div v-else-if="rule" class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button
            @click="router.back()"
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">记账规则详情</h1>
            <p class="text-sm text-gray-600 mt-1">ID: #{{ rule.id }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!isEditing"
            @click="isEditing = true"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            编辑
          </button>
          <button
            v-else
            @click="saveRule"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            保存
          </button>
          <button
            v-if="isEditing"
            @click="isEditing = false; resetForm()"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="deleteRule"
            class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      <!-- Rule Form/Display -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <!-- Basic Info -->
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">业务事件名称</label>
              <input
                v-if="isEditing"
                v-model="form.eventName"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p v-else class="text-gray-900">{{ rule.eventName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">规则标识</label>
              <p class="text-gray-600 font-mono">{{ rule.ruleKey }}</p>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">事件描述</label>
              <textarea
                v-if="isEditing"
                v-model="form.eventDescription"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <p v-else class="text-gray-700">{{ rule.eventDescription || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">所属场景</label>
              <p class="text-gray-900">{{ rule.scenario?.name || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <span
                :class="{
                  'px-3 py-1 text-sm rounded-full': true,
                  'bg-green-100 text-green-700': rule.status === 'confirmed',
                  'bg-yellow-100 text-yellow-700': rule.status === 'proposal',
                }"
              >
                {{ rule.status === 'confirmed' ? '已确认' : '建议' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Accounting Entry -->
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">会计分录</h2>
          <div class="grid grid-cols-2 gap-6">
            <!-- Debit Side -->
            <div class="bg-amber-50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded">借</span>
                <span class="font-medium text-gray-900">借方</span>
              </div>
              <div v-if="rule.debitAccount" class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目代码:</span>
                  <span class="font-mono text-blue-600 font-medium">{{ rule.debitAccount.code }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目名称:</span>
                  <span class="text-gray-900">{{ rule.debitAccount.name }}</span>
                </div>
              </div>
              <div v-else-if="rule.debitSide" class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目代码:</span>
                  <span class="font-mono text-blue-600 font-medium">{{ rule.debitSide.accountCode }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目名称:</span>
                  <span class="text-gray-900">{{ rule.debitSide.accountName }}</span>
                </div>
                <div v-if="rule.debitSide.amountFormula" class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">金额公式:</span>
                  <span class="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{{ rule.debitSide.amountFormula }}</span>
                </div>
              </div>
              <p v-else class="text-gray-400">未设置借方科目</p>
            </div>

            <!-- Credit Side -->
            <div class="bg-emerald-50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold rounded">贷</span>
                <span class="font-medium text-gray-900">贷方</span>
              </div>
              <div v-if="rule.creditAccount" class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目代码:</span>
                  <span class="font-mono text-blue-600 font-medium">{{ rule.creditAccount.code }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目名称:</span>
                  <span class="text-gray-900">{{ rule.creditAccount.name }}</span>
                </div>
              </div>
              <div v-else-if="rule.creditSide" class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目代码:</span>
                  <span class="font-mono text-blue-600 font-medium">{{ rule.creditSide.accountCode }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">科目名称:</span>
                  <span class="text-gray-900">{{ rule.creditSide.accountName }}</span>
                </div>
                <div v-if="rule.creditSide.amountFormula" class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">金额公式:</span>
                  <span class="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{{ rule.creditSide.amountFormula }}</span>
                </div>
              </div>
              <p v-else class="text-gray-400">未设置贷方科目</p>
            </div>
          </div>

          <!-- Amount Formula -->
          <div v-if="rule.amountFormula" class="mt-4 p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-medium text-gray-700 mb-1">通用金额公式</label>
            <code class="block font-mono text-sm text-gray-800 bg-gray-100 px-3 py-2 rounded">{{ rule.amountFormula }}</code>
          </div>
        </div>

        <!-- Systems -->
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">所属体系</h2>
          <div v-if="rule.systems && rule.systems.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="systemRule in rule.systems"
              :key="systemRule.systemId"
              class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
            >
              {{ systemRule.system?.name || `体系 #${systemRule.systemId}` }}
            </span>
          </div>
          <p v-else class="text-gray-400">未分配到任何体系</p>
        </div>

        <!-- Metadata -->
        <div class="p-6 bg-gray-50">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">元数据</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">创建时间:</span>
              <span class="ml-2 text-gray-900">{{ formatDateTime(rule.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-600">更新时间:</span>
              <span class="ml-2 text-gray-900">{{ formatDateTime(rule.updatedAt) }}</span>
            </div>
            <div v-if="rule.triggerType">
              <span class="text-gray-600">触发类型:</span>
              <span class="ml-2 text-gray-900">{{ rule.triggerType }}</span>
            </div>
            <div v-if="rule.conditions">
              <span class="text-gray-600">触发条件:</span>
              <code class="ml-2 text-xs font-mono text-gray-700 bg-gray-200 px-2 py-0.5 rounded">{{ JSON.stringify(rule.conditions) }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const ruleId = parseInt(route.params.id as string)

const loading = ref(true)
const error = ref('')
const rule = ref<any>(null)
const isEditing = ref(false)

const form = ref({
  eventName: '',
  eventDescription: '',
})

async function fetchRule() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch(`/api/journal-rules/${ruleId}`)
    
    if (response.success) {
      rule.value = response.data
      resetForm()
    } else {
      error.value = '加载规则失败'
    }
  } catch (e: any) {
    error.value = e?.data?.message || '加载规则失败'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  if (rule.value) {
    form.value = {
      eventName: rule.value.eventName || '',
      eventDescription: rule.value.eventDescription || '',
    }
  }
}

async function saveRule() {
  try {
    const response = await $fetch(`/api/journal-rules/${ruleId}`, {
      method: 'PATCH',
      body: {
        eventName: form.value.eventName,
        eventDescription: form.value.eventDescription,
      },
    })
    
    if (response.success) {
      rule.value = response.data
      isEditing.value = false
    }
  } catch (e: any) {
    alert(e?.data?.message || '保存失败')
  }
}

async function deleteRule() {
  if (!confirm('确定要删除这条记账规则吗？')) return
  
  try {
    const response = await $fetch(`/api/journal-rules/${ruleId}`, {
      method: 'DELETE',
    })
    
    if (response.success) {
      router.push('/journal-rules')
    }
  } catch (e: any) {
    alert(e?.data?.message || '删除失败')
  }
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchRule()
})
</script>
