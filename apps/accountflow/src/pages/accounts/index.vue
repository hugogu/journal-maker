<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">会计科目</h1>
      <button class="btn-primary" @click="showAddModal = true">
        添加科目
      </button>
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
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="account in accounts" :key="account.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono">{{ account.code }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ account.name }}</td>
            <td class="px-4 py-3 text-sm">
              <span :class="typeClass(account.type)" class="px-2 py-1 rounded text-xs">
                {{ typeText(account.type) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">{{ directionText(account.direction) }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ account.description || '-' }}</td>
          </tr>
        </tbody>
      </table>
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
import { ref, onMounted } from 'vue'

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

onMounted(async () => {
  const response = await $fetch('/api/accounts')
  if (response.success) {
    accounts.value = response.data
  }
})

function typeText(type: string) {
  const map = { asset: '资产', liability: '负债', equity: '权益', revenue: '收入', expense: '费用' }
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
  const map = { debit: '借', credit: '贷', both: '借/贷' }
  return map[dir] || dir
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
