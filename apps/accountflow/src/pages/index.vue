<template>
  <div class="space-y-8">
    <section class="text-center py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">AccountFlow</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        AI辅助会计规则分析工具<br />
        通过AI辅助梳理业务场景中的信息流和资金流，确定会计分录设计
      </p>
      <div class="mt-8 flex justify-center gap-4">
        <NuxtLink
          to="/scenarios"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          查看场景
        </NuxtLink>
        <NuxtLink
          to="/accounts"
          class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          管理科目
        </NuxtLink>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold mb-2">场景分析</h3>
        <p class="text-gray-600">创建业务场景，AI辅助分析会计规则</p>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold mb-2">流程可视化</h3>
        <p class="text-gray-600">实时流程图展示信息流和资金流</p>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold mb-2">示例交易</h3>
        <p class="text-gray-600">自动生成完整示例记账数据</p>
      </div>
    </section>
  </div>
</template>
