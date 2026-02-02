<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Prompt 模板管理</h1>
      <NuxtLink to="/admin/prompts/new" class="btn-primary">
        新建模板
      </NuxtLink>
    </div>

    <div class="card">
      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-600">加载中...</div>
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-600">
        {{ error }}
      </div>

      <div v-else-if="templates.length === 0" class="text-center py-8 text-gray-500">
        暂无 Prompt 模板
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b">
            <th class="text-left py-3 px-4">场景类型</th>
            <th class="text-left py-3 px-4">名称</th>
            <th class="text-left py-3 px-4">描述</th>
            <th class="text-left py-3 px-4">当前版本</th>
            <th class="text-left py-3 px-4">版本数</th>
            <th class="text-right py-3 px-4">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="template in templates" :key="template.id" class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {{ formatScenarioType(template.scenarioType) }}
              </span>
            </td>
            <td class="py-3 px-4 font-medium">{{ template.name }}</td>
            <td class="py-3 px-4 text-gray-600">{{ template.description || '-' }}</td>
            <td class="py-3 px-4">
              <span v-if="template.activeVersion" class="text-green-600">
                v{{ template.activeVersion.versionNumber }}
              </span>
              <span v-else class="text-gray-400">未激活</span>
            </td>
            <td class="py-3 px-4">{{ template.versionCount }}</td>
            <td class="py-3 px-4 text-right">
              <NuxtLink :to="`/admin/prompts/${template.id}`" class="text-blue-600 hover:text-blue-800">
                编辑
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { templates, loading, error, fetchTemplates } = usePrompts()

onMounted(() => {
  fetchTemplates()
})

function formatScenarioType(type: string): string {
  const map: Record<string, string> = {
    'scenario_analysis': '场景分析',
    'sample_generation': '示例生成',
    'prompt_generation': 'Prompt生成',
    'flowchart_generation': '流程图生成'
  }
  return map[type] || type
}
</script>
