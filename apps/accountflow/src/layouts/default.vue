<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">A</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-900">AccountFlow</h1>
        </div>
        <nav class="flex gap-4">
          <NuxtLink to="/" class="text-gray-600 hover:text-gray-900">首页</NuxtLink>
          <NuxtLink to="/scenarios" class="text-gray-600 hover:text-gray-900">场景</NuxtLink>
          <NuxtLink to="/accounts" class="text-gray-600 hover:text-gray-900">科目</NuxtLink>
          <NuxtLink to="/admin" class="text-gray-600 hover:text-gray-900">管理</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
