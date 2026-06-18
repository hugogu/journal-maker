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
              <Icon name="account" class="h-6 w-6 text-blue-600" />
            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                {{ account ? '编辑科目' : '新建科目' }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  {{ account ? '修改科目信息和体系分配' : '创建新科目并分配到相关体系' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="onSubmit" class="mt-6 space-y-4">
            <!-- Code -->
            <div>
              <label for="code" class="block text-sm font-medium text-gray-700">
                科目代码 <span class="text-red-500">*</span>
              </label>
              <input
                id="code"
                v-model="form.code"
                type="text"
                required
                maxlength="20"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：1001"
              />
            </div>

            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                科目名称 <span class="text-red-500">*</span>
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                maxlength="100"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：现金"
              />
            </div>

            <!-- Type -->
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700">
                科目类型 <span class="text-red-500">*</span>
              </label>
              <select
                id="type"
                v-model="form.type"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">选择类型</option>
                <option value="asset">资产</option>
                <option value="liability">负债</option>
                <option value="equity">权益</option>
                <option value="revenue">收入</option>
                <option value="expense">费用</option>
              </select>
            </div>

            <!-- Direction -->
            <div>
              <label for="direction" class="block text-sm font-medium text-gray-700">
                默认方向 <span class="text-red-500">*</span>
              </label>
              <select
                id="direction"
                v-model="form.direction"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">选择方向</option>
                <option value="debit">借方</option>
                <option value="credit">贷方</option>
                <option value="both">双向</option>
              </select>
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                描述
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                maxlength="500"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="可选：科目的详细描述"
              ></textarea>
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
            {{ isSaving ? '保存中...' : (account ? '保存' : '创建') }}
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
import type { Account, AccountingSystem } from '~/types'

const props = defineProps<{
  account?: Account | null
  systems: AccountingSystem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const isSaving = ref(false)

const form = ref({
  code: '',
  name: '',
  type: '',
  direction: '',
  description: '',
})

const selectedSystemIds = ref<number[]>([])

onMounted(() => {
  if (props.account) {
    form.value = {
      code: props.account.code,
      name: props.account.name,
      type: props.account.type,
      direction: props.account.direction,
      description: props.account.description || '',
    }
    // Load system assignments
    loadSystemAssignments()
  }
})

async function loadSystemAssignments() {
  if (!props.account) return

  try {
    const { data } = await useFetch(`/api/accounts/${props.account.id}/systems`)
    if ((data.value as any)?.data?.systems) {
      selectedSystemIds.value = (data.value as any).data.systems.map((s: any) => s.id)
    }
  } catch (err) {
    console.error('Failed to load system assignments:', err)
  }
}

const isValid = computed(() => {
  return (
    form.value.code &&
    form.value.name &&
    form.value.type &&
    form.value.direction &&
    selectedSystemIds.value.length > 0
  )
})

async function onSubmit() {
  if (!isValid.value) return

  isSaving.value = true

  try {
    const data = {
      ...form.value,
      systemIds: selectedSystemIds.value,
    }

    if (props.account) {
      // Update existing
      await $fetch(`/api/accounts/${props.account.id}`, {
        method: 'PATCH',
        body: data,
      })
    } else {
      // Create new
      await $fetch('/api/accounts', {
        method: 'POST',
        body: data,
      })
    }

    emit('save', data)
  } catch (err: any) {
    console.error('Failed to save account:', err)
    alert(err.message || '保存失败')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';
</style>
