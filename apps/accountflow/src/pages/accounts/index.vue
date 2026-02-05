<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">会计科目</h1>
        <p class="text-sm text-gray-600 mt-1">管理企业会计科目表</p>
      </div>
      <button class="btn-primary inline-flex items-center gap-2" @click="showAddModal = true">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        添加科目
      </button>
    </div>

    <!-- Filters and Search Bar -->
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <!-- Search Input -->
          <div class="md:col-span-5">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  class="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10 w-full"
                placeholder="搜索科目代码或名称..."
              />
            </div>
          </div>

          <!-- Type Filter -->
          <div class="md:col-span-3">
            <select v-model="filterType" class="input w-full">
              <option value="">所有类型</option>
              <option value="asset">资产</option>
              <option value="liability">负债</option>
              <option value="equity">权益</option>
              <option value="revenue">收入</option>
              <option value="expense">费用</option>
            </select>
          </div>

          <!-- Sort Field -->
          <div class="md:col-span-3">
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
              <svg
                v-if="sortOrder === 'asc'"
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                ></path>
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div
          class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600"
        >
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            共 {{ accounts.length }} 个科目
          </span>
          <span v-if="searchQuery || filterType" class="flex items-center gap-1 text-blue-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              ></path>
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
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              代码
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              名称
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              类型
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              方向
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              说明
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="account in filteredAndSortedAccounts"
            :key="account.id"
            class="hover:bg-blue-50/50 transition-colors"
          >
            <td class="px-6 py-4 text-sm">
              <span v-if="editingId !== account.id" class="font-mono text-blue-600 font-medium">{{
                account.code
              }}</span>
              <input
                v-else
                v-model="editForm.code"
                type="text"
                class="input text-xs py-1 w-24"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              />
            </td>
            <td class="px-6 py-4 text-sm">
              <span v-if="editingId !== account.id" class="font-medium text-gray-900">{{
                account.name
              }}</span>
              <input
                v-else
                v-model="editForm.name"
                type="text"
                class="input text-xs py-1"
                @keyup.enter="saveEdit(account)"
                @keyup.escape="cancelEdit"
              />
            </td>
            <td class="px-6 py-4 text-sm">
              <span
                v-if="editingId !== account.id"
                :class="typeClass(account.type)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
              >
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
              <span v-if="editingId !== account.id" class="text-gray-700">{{
                directionText(account.direction)
              }}</span>
              <select v-else v-model="editForm.direction" class="input text-xs py-1">
                <option value="debit">借方</option>
                <option value="credit">贷方</option>
              </select>
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
              />
            </td>
            <td class="px-6 py-4 text-sm text-right">
              <div v-if="editingId !== account.id" class="flex gap-1 justify-end">
                <button
                  @click="startEdit(account)"
                  class="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  编辑
                </button>
                <button
                  @click="deleteAccount(account)"
                  class="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  删除
                </button>
              </div>
              <div v-else class="flex gap-1 justify-end">
                <button
                  @click="saveEdit(account)"
                  class="inline-flex items-center px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  保存
                </button>
                <button
                  @click="cancelEdit"
                  class="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  取消
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredAndSortedAccounts.length === 0" class="text-center py-16">
        <svg
          class="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <p class="text-gray-500 mb-2">
          {{ searchQuery || filterType ? '未找到匹配的科目' : '暂无科目数据' }}
        </p>
        <button
          v-if="!searchQuery && !filterType"
          @click="showAddModal = true"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          点击添加第一个科目 →
        </button>
        <button
          v-else
          @click="
            searchQuery = ''
            filterType = ''
          "
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          清除筛选条件
        </button>
      </div>
    </div>

    <!-- Add Account Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold mb-4">添加科目</h2>
        <form @submit.prevent="addAccount" class="space-y-4">
          <div>
            <label class="label">科目代码</label>
            <input
              v-model="newAccount.code"
              type="text"
              class="input"
              placeholder="1001"
              required
            />
          </div>
          <div>
            <label class="label">科目名称</label>
            <input
              v-model="newAccount.name"
              type="text"
              class="input"
              placeholder="库存现金"
              required
            />
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
            <button type="button" class="btn-secondary flex-1" @click="showAddModal = false">
              取消
            </button>
            <button type="submit" class="btn-primary flex-1" :disabled="adding">
              {{ adding ? '添加中...' : '添加' }}
            </button>
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
      filtered = filtered.filter(
        (account: any) =>
          account.code.toLowerCase().includes(query) || account.name.toLowerCase().includes(query)
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
    const map: Record<string, string> = {
      asset: '资产',
      liability: '负债',
      equity: '权益',
      revenue: '收入',
      expense: '费用',
    }
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
        newAccount.value = {
          code: '',
          name: '',
          type: 'asset',
          direction: 'debit',
          description: '',
        }
      }
    } catch (e) {
      alert('添加失败')
    } finally {
      adding.value = false
    }
  }
</script>
