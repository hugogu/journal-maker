<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">管理后台</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink to="/admin/ai-providers" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">Prompt 管理</h2>
            <p class="text-gray-600 text-sm">管理Prompt模板和版本</p>
          </div>
        </div>
      </NuxtLink>
      
      <NuxtLink to="/admin/ai-providers" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">AI Provider 管理</h2>
            <p class="text-gray-600 text-sm">管理多个AI服务提供商</p>
          </div>
        </div>
      </NuxtLink>
      
      <NuxtLink to="/accounts" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">科目管理</h2>
            <p class="text-gray-600 text-sm">管理共享会计科目</p>
          </div>
        </div>
      </NuxtLink>
      
      <NuxtLink to="/scenarios" class="card hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold">场景管理</h2>
            <p class="text-gray-600 text-sm">管理业务场景和模板</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
