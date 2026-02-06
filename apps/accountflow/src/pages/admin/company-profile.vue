<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">公司资料</h1>
    </div>

    <div v-if="loading" class="text-center py-8"><div class="text-gray-600">加载中...</div></div>
    <div v-else-if="error" class="text-center py-8 text-red-600">{{ error }}</div>

    <form v-else @submit.prevent="handleSubmit" class="card space-y-6">
      <div>
        <label class="label">公司名称 <span class="text-red-500">*</span></label>
        <input v-model="form.name" type="text" class="input" placeholder="输入公司名称" required />
      </div>

      <div>
        <label class="label">行业</label>
        <input v-model="form.industry" type="text" class="input" placeholder="例如：制造业、零售业、服务业..." />
      </div>

      <div>
        <label class="label">业务模式</label>
        <textarea v-model="form.businessModel" rows="3" class="input" placeholder="描述公司的主要业务模式..." />
      </div>

      <div>
        <label class="label">会计偏好</label>
        <textarea v-model="form.accountingPreference" rows="3" class="input" placeholder="特殊的会计处理偏好或规则..." />
      </div>

      <div>
        <label class="label">备注</label>
        <textarea v-model="form.notes" rows="4" class="input" placeholder="其他需要AI了解的信息..." />
      </div>

      <div class="flex gap-4 pt-4">
        <button type="submit" class="btn-primary relative" :disabled="saving">
          <span class="flex items-center gap-2">
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <svg v-else-if="saved" class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ saving ? '保存中...' : saved ? '已保存' : '保存' }}
          </span>
        </button>
        <button type="button" @click="resetForm" class="btn-secondary">重置</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const { profile, loading, error, fetchProfile, saveProfile } = useCompanyProfile()

const form = reactive({
  name: '',
  industry: '',
  businessModel: '',
  accountingPreference: '',
  notes: ''
})

const saving = ref(false)
const saved = ref(false)

onMounted(async () => {
  await fetchProfile()
  resetForm()
})

function resetForm() {
  if (profile.value) {
    form.name = profile.value.name
    form.industry = profile.value.industry || ''
    form.businessModel = profile.value.businessModel || ''
    form.accountingPreference = profile.value.accountingPreference || ''
    form.notes = profile.value.notes || ''
  }
}

async function handleSubmit() {
  saving.value = true
  saved.value = false
  try {
    await saveProfile({ ...form })
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 3000)
  } finally {
    saving.value = false
  }
}
</script>
