<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">会计科目</h1>
      <button class="btn-primary" @click="showAddModal = true">
        添加科目
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-[200px]">
          <input 
            v-model="searchQuery" 
            type="text" 
            class="input" 
            placeholder="搜索科目代码或名称..."
          >
        </div>
        <select v-model="filterType" class="input">
          <option value="">所有类型</option>
          <option value="asset">资产</option>
          <option value="liability">负债</option>
          <option value="equity">权益</option>
          <option value="revenue">收入</option>
          <option value="expense">费用</option>
        </select>
        <select v-model="sortField" class="input">
          <option value="code">按代码排序</option>
          <option value="name">按名称排序</option>
          <option value="type">按类型排序</option>
          <option value="direction">按方向排序</option>
        </select>
        <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="btn-secondary">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">代码</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">名称</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">方向</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">说明</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="account in filteredAndSortedAccounts" :key="account.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono">
              <span v-if="editingId !== account.id">{{ account.code }}</span>
              <input 
                v-else 
                v-model="editForm.code" 
                type="text" 
                class="input text-xs py-1"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              >
            </td>
            <td class="px-4 py-3 text-sm font-medium">
              <span v-if="editingId !== account.id">{{ account.name }}</span>
              <input 
                v-else 
                v-model="editForm.name" 
                type="text" 
                class="input text-xs py-1"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              >
            </td>
            <td class="px-4 py-3 text-sm">
              <span v-if="editingId !== account.id" :class="typeClass(account.type)" class="px-2 py-1 rounded text-xs">
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
            <td class="px-4 py-3 text-sm">
              <span v-if="editingId !== account.id">{{ directionText(account.direction) }}</span>
              <select v-else v-model="editForm.direction" class="input text-xs py-1">
                <option value="debit">借方</option>
                <option value="credit">贷方</option>
              </select>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
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
            <td class="px-4 py-3 text-sm">
              <div v-if="editingId !== account.id" class="flex gap-2">
                <button @click="startEdit(account)" class="text-blue-600 hover:text-blue-800">
                  编辑
                </button>
                <button @click="deleteAccount(account)" class="text-red-600 hover:text-red-800">
                  删除
                </button>
              </div>
              <div v-else class="flex gap-2">
                <button @click="saveEdit(account)" class="text-green-600 hover:text-green-800">
                  保存
                </button>
                <button @click="cancelEdit" class="text-gray-600 hover:text-gray-800">
                  取消
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredAndSortedAccounts.length === 0" class="text-center py-8 text-gray-500">
        {{ searchQuery || filterType ? '未找到匹配的科目' : '暂无科目数据' }}
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
          <div class="flex gap-3">
            <button type="button" class="btn-secondary flex-1" @click="showAddModal = false">取消</button>
            <button type="submit" class="btn-primary flex-1" :disabled="adding">{{ adding ? '添加中...' : '添加' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const accounts = ref([])
const showAddModal = ref(false)
const adding = ref(false)
const newAccount = ref({
  code: '',
  name: '',
  type: 'asset',
  direction: 'debit',
  description: '',
})

// Filtering and sorting
const searchQuery = ref('')
const filterType = ref('')
const sortField = ref('code')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Inline editing
const editingId = ref<number | null>(null)
const editForm = ref({
  code: '',
  name: '',
  type: 'asset',
  direction: 'debit',
  description: '',
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
  const response = await $fetch('/api/accounts')
  if (response.success) {
    accounts.value = response.data
  }
})

function typeText(type: string) {
  const map: Record<string, string> = { asset: '资产', liability: '负债', equity: '权益', revenue: '收入', expense: '费用' }
  return map[type] || type
}

function typeClass(type: string) {
  const map: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-green-100 text-green-800',
    revenue: 'bg-purple-100 text-purple-800',
    expense: 'bg-orange-100 text-orange-800',
  }
  return map[type] || 'bg-gray-100'
}

function directionText(dir: string) {
  const map: Record<string, string> = { debit: '借', credit: '贷', both: '借/贷' }
  return map[dir] || dir
}

function startEdit(account: any) {
  editingId.value = account.id
  editForm.value = { ...account }
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
      method: 'PUT',
      body: editForm.value,
    })
    if (response.success) {
      // Update the account in the list
      const index = accounts.value.findIndex((a: any) => a.id === account.id)
      if (index !== -1) {
        accounts.value[index] = { ...account, ...editForm.value }
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
</script>
