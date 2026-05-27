<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Background overlay -->
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <!-- Header -->
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Icon name="rule" class="h-6 w-6 text-blue-600" />
            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                {{ rule ? '编辑规则' : '新建规则' }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  {{ rule ? '修改规则信息和体系分配' : '创建新规则并分配到相关体系' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="onSubmit" class="mt-6 space-y-4">
            <!-- Event Name -->
            <div>
              <label for="eventName" class="block text-sm font-medium text-gray-700">
                规则名称 <span class="text-red-500">*</span>
              </label>
              <input
                id="eventName"
                v-model="form.eventName"
                type="text"
                required
                maxlength="100"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：销售收入确认"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                描述
              </label>
              <textarea
                id="description"
                v-model="form.eventDescription"
                rows="2"
                maxlength="1000"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="可选：规则的详细描述"
              ></textarea>
            </div>

            <!-- Debit Account -->
            <div>
              <label for="debitAccount" class="block text-sm font-medium text-gray-700">
                借方科目
              </label>
              <select
                id="debitAccount"
                v-model="form.debitAccountId"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option :value="null">选择借方科目</option>
                <option
                  v-for="account in accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.code }} - {{ account.name }}
                </option>
              </select>
            </div>

            <!-- Credit Account -->
            <div>
              <label for="creditAccount" class="block text-sm font-medium text-gray-700">
                贷方科目
              </label>
              <select
                id="creditAccount"
                v-model="form.creditAccountId"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option :value="null">选择贷方科目</option>
                <option
                  v-for="account in accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.code }} - {{ account.name }}
                </option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700">
                状态
              </label>
              <select
                id="status"
                v-model="form.status"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="proposal">提案</option>
                <option value="confirmed">已确认</option>
              </select>
            </div>

            <!-- System Selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                所属体系 <span class="text-red-500">*</span>
              </label>
              <div class="space-y-2">
                <label
                  v-for="system in systems"
                  :key="system.id"
                  class="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="selectedSystemIds.includes(system.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'"
                >
                  <input
                    type="checkbox"
                    :value="system.id"
                    v-model="selectedSystemIds"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div class="ml-3 flex-1">
                    <div class="font-medium text-gray-900">{{ system.name }}</div>
                    <div class="text-sm text-gray-500">{{ system.description || '' }}</div>
                  </div>
                  <span
                    class="system-indicator text-xs"
                    :class="system.type === 'builtin' ? 'system-indicator--builtin' : 'system-indicator--custom'"
                  >
                    {{ system.type === 'builtin' ? '内置' : '自定义' }}
                  </span>
                </label>
              </div>
              <p v-if="selectedSystemIds.length === 0" class="mt-2 text-sm text-red-600">
                请至少选择一个体系
              </p>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            @click="onSubmit"
            :disabled="!isValid || isSaving"
            class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon v-if="isSaving" name="loading" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSaving ? '保存中...' : (rule ? '保存' : '创建') }}
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { JournalRule, AccountingSystem, Account } from '~/types'

const props = defineProps<{
  rule?: JournalRule | null
  systems: AccountingSystem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const isSaving = ref(false)
const accounts = ref<Account[]>([])

const form = ref({
  eventName: '',
  eventDescription: '',
  debitAccountId: null as number | null,
  creditAccountId: null as number | null,
  status: 'proposal' as 'proposal' | 'confirmed',
})

const selectedSystemIds = ref<number[]>([])

onMounted(async () => {
  // Load accounts
  await loadAccounts()

  // Load rule data if editing
  if (props.rule) {
    form.value = {
      eventName: props.rule.eventName || '',
      eventDescription: props.rule.eventDescription || '',
      debitAccountId: props.rule.debitAccountId,
      creditAccountId: props.rule.creditAccountId,
      status: (props.rule.status as 'proposal' | 'confirmed') || 'proposal',
    }
    // Load system assignments
    loadSystemAssignments()
  }
})

async function loadAccounts() {
  try {
    const { data } = await useFetch('/api/accounts')
    accounts.value = (data.value as any)?.data || []
  } catch (err) {
    console.error('Failed to load accounts:', err)
  }
}

async function loadSystemAssignments() {
  if (!props.rule) return

  // This is a placeholder - in real implementation, you'd fetch from an API
  // For now, we'll assume the rule object might have systems
  if ((props.rule as any).systems) {
    selectedSystemIds.value = (props.rule as any).systems.map((s: any) => s.id)
  }
}

const isValid = computed(() => {
  return form.value.eventName && selectedSystemIds.value.length > 0
})

async function onSubmit() {
  if (!isValid.value) return

  isSaving.value = true

  try {
    const data = {
      ...form.value,
      systemIds: selectedSystemIds.value,
    }

    if (props.rule) {
      // Update existing - use the batch endpoint for simplicity
      await $fetch('/api/journal-rules/batch', {
        method: 'POST',
        body: {
          rules: [{
            eventName: data.eventName,
            eventDescription: data.eventDescription,
            debitAccountId: data.debitAccountId,
            creditAccountId: data.creditAccountId,
          }],
          systemIds: data.systemIds,
        },
      })
    } else {
      // Create new
      await $fetch('/api/journal-rules/batch', {
        method: 'POST',
        body: {
          rules: [{
            eventName: data.eventName,
            eventDescription: data.eventDescription,
            debitAccountId: data.debitAccountId,
            creditAccountId: data.creditAccountId,
          }],
          systemIds: data.systemIds,
        },
      })
    }

    emit('save', data)
  } catch (err: any) {
    console.error('Failed to save rule:', err)
    alert(err.message || '保存失败')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';
</style>
