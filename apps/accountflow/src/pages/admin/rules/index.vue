<template>
  <div class="rules-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">规则管理</h1>
      <p class="text-gray-600 mt-1">
        管理会计规则并分配到不同体系
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

        <!-- Search -->
        <div class="flex items-center gap-2 flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索规则..."
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            @click="onSearch"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            搜索
          </button>
        </div>

        <!-- Create Button -->
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon name="plus" class="w-4 h-4" />
          新建规则
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

    <!-- Rules Table -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              规则名称
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              借方科目
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              贷方科目
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              所属体系
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="rule in rules"
            :key="rule.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ rule.eventName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <span v-if="rule.debitAccount">
                {{ rule.debitAccount.code }} - {{ rule.debitAccount.name }}
              </span>
              <span v-else-if="rule.debitSide" class="text-sm text-gray-700">
                {{ rule.debitSide.accountCode || '-' }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <span v-if="rule.creditAccount">
                {{ rule.creditAccount.code }} - {{ rule.creditAccount.name }}
              </span>
              <span v-else-if="rule.creditSide" class="text-sm text-gray-700">
                {{ rule.creditSide.accountCode || '-' }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="system in rule.systems || []"
                  :key="system.id"
                  class="system-indicator text-xs"
                  :class="system.type === 'builtin' ? 'system-indicator--builtin' : 'system-indicator--custom'"
                >
                  {{ system.name }}
                </span>
                <span
                  v-if="!rule.systems || rule.systems.length === 0"
                  class="text-gray-400 text-xs"
                >
                  未分配
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="rule.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              >
                {{ rule.status === 'confirmed' ? '已确认' : '提案' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="editRule(rule)"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                编辑
              </button>
              <button
                @click="deleteRule(rule.id)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="rules.length === 0" class="text-center py-12 text-gray-500">
        <Icon name="rule" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无规则</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <RuleFormModal
      v-if="showCreateModal || editingRule"
      :rule="editingRule"
      :systems="systems"
      @close="closeModal"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRules } from '~/composables/useRules'
import { useSystems } from '~/composables/useSystems'
import RuleFormModal from '~/components/rules/RuleFormModal.vue'

const { rules, loading, error, fetchRules, fetchRulesBySystem, deleteRule } = useRules()
const { systems, fetchSystems } = useSystems()

const selectedSystemId = ref<number | null>(null)
const searchQuery = ref('')
const showCreateModal = ref(false)
const editingRule = ref<any>(null)

onMounted(async () => {
  await fetchSystems()
  await fetchRules()
})

async function onSystemChange() {
  if (selectedSystemId.value) {
    await fetchRulesBySystem(selectedSystemId.value)
  } else {
    await fetchRules()
  }
}

async function onSearch() {
  await fetchRules({ search: searchQuery.value })
}

function editRule(rule: any) {
  editingRule.value = rule
  showCreateModal.value = false
}

function closeModal() {
  showCreateModal.value = false
  editingRule.value = null
}

async function onSave() {
  await fetchRules()
  closeModal()
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';

.rules-page {
  @apply max-w-7xl mx-auto px-4 py-6;
}
</style>
