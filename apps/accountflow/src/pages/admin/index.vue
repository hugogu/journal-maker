<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">管理后台</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink to="/admin/ai-providers" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">AI Provider 管理</h2>
            <p class="text-gray-600 text-sm">配置AI服务连接参数</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/prompts" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">Prompt 管理</h2>
            <p class="text-gray-600 text-sm">管理Prompt模板和版本</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/company-profile" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg
              class="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">公司资料</h2>
            <p class="text-gray-600 text-sm">配置公司信息和业务偏好</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
