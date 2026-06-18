<template>
  <div class="accounts-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">科目管理</h1>
      <p class="text-gray-600 mt-1">
        管理会计科目并分配到不同体系
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="flex items-center gap-4">
        <!-- System Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">筛选体系:</label>
          <select
            v-model="selectedSystemId"
            @change="onSystemChange"
            class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option :value="null">全部体系</option>
            <option
              v-for="system in systems"
              :key="system.id"
              :value="system.id"
            >
              {{ system.name }}
            </option>
          </select>
        </div>

        <!-- Create Button -->
        <button
          @click="showCreateModal = true"
          class="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon name="plus" class="w-4 h-4" />
          新建科目
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">加载中...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Accounts Table -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              科目代码
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              科目名称
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              类型
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              所属体系
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="account in filteredAccounts"
            :key="account.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ account.code }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {{ account.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="getAccountTypeClass(account.type)"
              >
                {{ getAccountTypeLabel(account.type) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="system in account.systems || []"
                  :key="system.id"
                  class="system-indicator text-xs"
                  :class="system.type === 'builtin' ? 'system-indicator--builtin' : 'system-indicator--custom'"
                >
                  {{ system.name }}
                </span>
                <span
                  v-if="!account.systems || account.systems.length === 0"
                  class="text-gray-400 text-xs"
                >
                  未分配
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="editAccount(account)"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                编辑
              </button>
              <button
                @click="deleteAccount(account.id)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredAccounts.length === 0" class="text-center py-12 text-gray-500">
        <Icon name="account" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无科目</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <AccountFormModal
      v-if="showCreateModal || editingAccount"
      :account="editingAccount"
      :systems="systems"
      @close="closeModal"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAccounts } from '~/composables/useAccounts'
import { useSystems } from '~/composables/useSystems'
import AccountFormModal from '~/components/accounts/AccountFormModal.vue'

const { accounts, loading, error, filteredAccounts, fetchAccounts, deleteAccount } = useAccounts()
const { systems, fetchSystems } = useSystems()

const selectedSystemId = ref<number | null>(null)
const showCreateModal = ref(false)
const editingAccount = ref<any>(null)

onMounted(async () => {
  await fetchSystems()
  await fetchAccounts()
})

async function onSystemChange() {
  if (selectedSystemId.value) {
    await fetchAccounts(selectedSystemId.value)
  } else {
    await fetchAccounts()
  }
}

function editAccount(account: any) {
  editingAccount.value = account
  showCreateModal.value = false
}

function closeModal() {
  showCreateModal.value = false
  editingAccount.value = null
}

async function onSave(data: any) {
  if (editingAccount.value) {
    // Update existing
    await fetchAccounts()
  } else {
    // Create new
    await fetchAccounts()
  }
  closeModal()
}

function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    asset: '资产',
    liability: '负债',
    equity: '权益',
    revenue: '收入',
    expense: '费用',
  }
  return labels[type] || type
}

function getAccountTypeClass(type: string): string {
  const classes: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-green-100 text-green-800',
    revenue: 'bg-purple-100 text-purple-800',
    expense: 'bg-orange-100 text-orange-800',
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';

.accounts-page {
  @apply max-w-7xl mx-auto px-4 py-6;
}
</style>
