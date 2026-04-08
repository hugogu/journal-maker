<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">会计科目</h1>
        <p class="text-sm text-gray-600 mt-1">管理企业会计科目表</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary inline-flex items-center gap-2" @click="exportAccounts">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          导出
        </button>
        <button class="btn-secondary inline-flex items-center gap-2" @click="showImportDialog = true">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
          导入
        </button>
        <button class="btn-primary inline-flex items-center gap-2" @click="showAddModal = true">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          添加科目
        </button>
      </div>
    </div>

    <!-- Filters and Search Bar -->
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <!-- Search Input -->
          <div class="md:col-span-5">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10 w-full"
                placeholder="搜索科目代码或名称..."
              >
            </div>
          </div>

          <!-- Type Filter -->
          <div class="md:col-span-2">
            <select v-model="filterType" class="input w-full">
              <option value="">所有类型</option>
              <option value="asset">资产</option>
              <option value="liability">负债</option>
              <option value="equity">权益</option>
              <option value="revenue">收入</option>
              <option value="expense">费用</option>
            </select>
          </div>

          <!-- System Filter -->
          <div class="md:col-span-2">
            <select v-model="filterSystem" class="input w-full">
              <option value="">所有体系</option>
              <option v-for="system in systems" :key="system.id" :value="system.id">
                {{ system.name }}
              </option>
            </select>
          </div>

          <!-- Sort Field -->
          <div class="md:col-span-2">
            <select v-model="sortField" class="input w-full">
              <option value="code">按代码排序</option>
              <option value="name">按名称排序</option>
              <option value="type">按类型排序</option>
              <option value="direction">按方向排序</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="md:col-span-1">
            <button
              @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
              class="w-full h-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              :title="sortOrder === 'asc' ? '升序' : '降序'"
            >
              <svg v-if="sortOrder === 'asc'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
              </svg>
              <svg v-else class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            共 {{ accounts.length }} 个科目
          </span>
          <span v-if="searchQuery || filterType || filterSystem" class="flex items-center gap-1 text-blue-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            显示 {{ filteredAndSortedAccounts.length }} 个
          </span>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">代码</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">名称</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">类型</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">方向</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">所属体系</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">说明</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="account in filteredAndSortedAccounts" :key="account.id" class="hover:bg-blue-50/50 transition-colors">
            <td class="px-6 py-4 text-sm">
              <span v-if="editingId !== account.id" class="font-mono text-blue-600 font-medium">{{ account.code }}</span>
              <input
                v-else
                v-model="editForm.code"
                type="text"
                class="input text-xs py-1 w-24"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              >
            </td>
            <td class="px-6 py-4 text-sm">
              <span v-if="editingId !== account.id" class="font-medium text-gray-900">{{ account.name }}</span>
              <input
                v-else
                v-model="editForm.name"
                type="text"
                class="input text-xs py-1"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              >
            </td>
            <td class="px-6 py-4 text-sm">
              <span v-if="editingId !== account.id" :class="typeClass(account.type)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap">
                {{ typeText(account.type) }}
              </span>
              <select v-else v-model="editForm.type" class="input text-xs py-1">
                <option value="asset">资产</option>
                <option value="liability">负债</option>
                <option value="equity">权益</option>
                <option value="revenue">收入</option>
                <option value="expense">费用</option>
              </select>
            </td>
            <td class="px-6 py-4 text-sm">
              <span v-if="editingId !== account.id" class="text-gray-700">{{ directionText(account.direction) }}</span>
              <select v-else v-model="editForm.direction" class="input text-xs py-1">
                <option value="debit">借方</option>
                <option value="credit">贷方</option>
              </select>
            </td>
            <td class="px-6 py-4 text-sm">
              <div v-if="editingId !== account.id" class="flex flex-wrap gap-1">
                <span 
                  v-for="system in getAccountSystems(account.id)" 
                  :key="system.id"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ system.name }}
                </span>
                <span v-if="getAccountSystems(account.id).length === 0" class="text-gray-400 text-xs">-</span>
              </div>
              <div v-else class="space-y-1">
                <label v-for="system in systems" :key="system.id" class="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    :value="system.id" 
                    v-model="editForm.systemIds"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                  <span>{{ system.name }}</span>
                </label>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              <span v-if="editingId !== account.id">{{ account.description || '-' }}</span>
              <input
                v-else
                v-model="editForm.description"
                type="text"
                class="input text-xs py-1"
                placeholder="说明"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              >
            </td>
            <td class="px-6 py-4 text-sm text-right">
              <div v-if="editingId !== account.id" class="flex gap-1 justify-end">
                <button
                  @click="startEdit(account)"
                  class="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  title="编辑"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  @click="deleteAccount(account)"
                  class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="删除"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
              <div v-else class="flex gap-1 justify-end">
                <button
                  @click="saveEdit(account)"
                  class="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                  title="保存"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button
                  @click="cancelEdit"
                  class="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="取消"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredAndSortedAccounts.length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-gray-500 mb-2">{{ searchQuery || filterType ? '未找到匹配的科目' : '暂无科目数据' }}</p>
        <button v-if="!searchQuery && !filterType" @click="showAddModal = true" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
          点击添加第一个科目 →
        </button>
        <button v-else @click="searchQuery = ''; filterType = ''; filterSystem = ''" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
          清除筛选条件
        </button>
      </div>
    </div>

    <!-- Add Account Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold mb-4">添加科目</h2>
        <form @submit.prevent="addAccount" class="space-y-4">
          <div>
            <label class="label">科目代码</label>
            <input v-model="newAccount.code" type="text" class="input" placeholder="1001" required>
          </div>
          <div>
            <label class="label">科目名称</label>
            <input v-model="newAccount.name" type="text" class="input" placeholder="库存现金" required>
          </div>
          <div>
            <label class="label">类型</label>
            <select v-model="newAccount.type" class="input" required>
              <option value="asset">资产</option>
              <option value="liability">负债</option>
              <option value="equity">权益</option>
              <option value="revenue">收入</option>
              <option value="expense">费用</option>
            </select>
          </div>
          <div>
            <label class="label">方向</label>
            <select v-model="newAccount.direction" class="input" required>
              <option value="debit">借方</option>
              <option value="credit">贷方</option>
              <option value="both">双向</option>
            </select>
          </div>
          <div>
            <label class="label">说明</label>
            <textarea v-model="newAccount.description" class="input" rows="2" />
          </div>
          <div>
            <label class="label">所属体系</label>
            <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <label v-for="system in systems" :key="system.id" class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  :value="system.id" 
                  v-model="newAccount.systemIds"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm">{{ system.name }}</span>
              </label>
              <p v-if="systems.length === 0" class="text-sm text-gray-500">暂无可用体系</p>
            </div>
          </div>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary flex-1" @click="showAddModal = false">取消</button>
            <button type="submit" class="btn-primary flex-1" :disabled="adding">{{ adding ? '添加中...' : '添加' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Import Dialog -->
    <AccountImportDialog
      :show="showImportDialog"
      @close="showImportDialog = false"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSystems } from '../../composables/useSystems'
import AccountImportDialog from '../../components/accounting/AccountImportDialog.vue'

const accounts = ref([])
const showAddModal = ref(false)
const showImportDialog = ref(false)
const adding = ref(false)
const newAccount = ref({
  code: '',
  name: '',
  type: 'asset',
  direction: 'debit',
  description: '',
  systemIds: [],
})

// Filtering and sorting
const searchQuery = ref('')
const filterType = ref('')
const filterSystem = ref('')
const sortField = ref('code')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Systems
const { systems, fetchSystems } = useSystems()
const accountSystems = ref<Record<number, any[]>>({})

// Inline editing
const editingId = ref<number | null>(null)
const editForm = ref({
  code: '',
  name: '',
  type: 'asset',
  direction: 'debit',
  description: '',
  systemIds: [] as number[],
})

const filteredAndSortedAccounts = computed(() => {
  let filtered = accounts.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((account: any) => 
      account.code.toLowerCase().includes(query) ||
      account.name.toLowerCase().includes(query)
    )
  }

  // Apply type filter
  if (filterType.value) {
    filtered = filtered.filter((account: any) => account.type === filterType.value)
  }

  // Apply system filter
  if (filterSystem.value) {
    const systemId = Number(filterSystem.value)
    filtered = filtered.filter((account: any) => {
      const systems = accountSystems.value[account.id] || []
      return systems.some((s: any) => s.systemId === systemId)
    })
  }

  // Apply sorting
  filtered.sort((a: any, b: any) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
})

onMounted(async () => {
  // Load accounts
  const response = await $fetch('/api/accounts')
  if (response.success) {
    accounts.value = response.data
  }
  
  // Load systems
  await fetchSystems()
  
  // Load account system assignments
  for (const account of accounts.value) {
    const systemsRes = await $fetch(`/api/accounts/${account.id}/systems`)
    if (systemsRes.success) {
      accountSystems.value[account.id] = systemsRes.data
    }
  }
})

function getAccountSystems(accountId: number) {
  const systemAssignments = accountSystems.value[accountId] || []
  return systemAssignments.map((assignment: any) => {
    const system = systems.value.find((s: any) => s.id === assignment.systemId)
    return system || { id: assignment.systemId, name: 'Unknown' }
  }).filter(Boolean)
}

function typeText(type: string) {
  const map: Record<string, string> = { asset: '资产', liability: '负债', equity: '权益', revenue: '收入', expense: '费用' }
  return map[type] || type
}

function typeClass(type: string) {
  const map: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-800 border-blue-200',
    liability: 'bg-red-100 text-red-800 border-red-200',
    equity: 'bg-green-100 text-green-800 border-green-200',
    revenue: 'bg-purple-100 text-purple-800 border-purple-200',
    expense: 'bg-orange-100 text-orange-800 border-orange-200',
  }
  return map[type] || 'bg-gray-100 border-gray-200'
}

function directionText(dir: string) {
  const map: Record<string, string> = { debit: '借', credit: '贷', both: '借/贷' }
  return map[dir] || dir
}

function startEdit(account: any) {
  editingId.value = account.id
  const accountSystemIds = (accountSystems.value[account.id] || []).map((s: any) => s.systemId)
  editForm.value = { ...account, systemIds: accountSystemIds }
}

function cancelEdit() {
  editingId.value = null
  editForm.value = {
    code: '',
    name: '',
    type: 'asset',
    direction: 'debit',
    description: '',
  }
}

async function saveEdit(account: any) {
  try {
    const response = await $fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      body: editForm.value,
    })
    if (response.success) {
      // Update the account in the list
      const index = accounts.value.findIndex((a: any) => a.id === account.id)
      if (index !== -1) {
        accounts.value[index] = { ...account, ...editForm.value }
      }
      // Update system assignments
      const systemsRes = await $fetch(`/api/accounts/${account.id}/systems`)
      if (systemsRes.success) {
        accountSystems.value[account.id] = systemsRes.data
      }
      editingId.value = null
    }
  } catch (error) {
    console.error('Failed to save account:', error)
    alert('保存失败')
  }
}

async function deleteAccount(account: any) {
  if (!confirm(`确定要删除科目 "${account.code} - ${account.name}" 吗？`)) {
    return
  }
  
  try {
    const response = await $fetch(`/api/accounts/${account.id}`, {
      method: 'DELETE',
    })
    if (response.success) {
      // Remove from list
      accounts.value = accounts.value.filter((a: any) => a.id !== account.id)
    }
  } catch (error: any) {
    console.error('Failed to delete account:', error)
    alert(error.data?.message || '删除失败')
  }
}

async function addAccount() {
  adding.value = true
  try {
    const response = await $fetch('/api/accounts', {
      method: 'POST',
      body: newAccount.value,
    })
    if (response.success) {
      accounts.value.push(response.data)
      showAddModal.value = false
      newAccount.value = { code: '', name: '', type: 'asset', direction: 'debit', description: '' }
    }
  } catch (e) {
    alert('添加失败')
  } finally {
    adding.value = false
  }
}

async function exportAccounts() {
  try {
    // Download CSV file directly
    const response = await $fetch('/api/accounts/export', {
      responseType: 'text',
    })
    
    const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accounts-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export error:', error)
    alert('导出失败')
  }
}

async function handleImportSuccess() {
  // Reload accounts after import
  const response = await $fetch('/api/accounts')
  if (response.success) {
    accounts.value = response.data
    
    // Reload account system assignments
    accountSystems.value = {}
    for (const account of accounts.value) {
      const systemsRes = await $fetch(`/api/accounts/${account.id}/systems`)
      if (systemsRes.success) {
        accountSystems.value[account.id] = systemsRes.data
      }
    }
  }
}
</script>
