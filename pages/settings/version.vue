<script setup lang="ts">
import { RefreshCw, AlertCircle, CheckCircle, Download } from 'lucide-vue-next'

const loading = ref(false)
const error = ref<string | null>(null)
const versionInfo = ref<{
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
} | null>(null)

// 检查版本
const checkVersion = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/version')
    if (response.ok) {
      versionInfo.value = response.result
    } else {
      error.value = response.error || 'Failed to check version'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to check version'
  }
  
  loading.value = false
}

// 更新 OpenClaw
const updating = ref(false)

const updateOpenClaw = async () => {
  if (!confirm('确定要更新 OpenClaw 吗？')) return
  
  updating.value = true
  
  try {
    const response = await $fetch('/api/version/update', {
      method: 'POST',
    })
    
    if (response.ok) {
      alert('更新成功！请重启应用。')
      await checkVersion()
    } else {
      alert('更新失败: ' + (response.error || '未知错误'))
    }
  } catch (e: any) {
    alert('更新失败: ' + e.message)
  }
  
  updating.value = false
}

// 页面加载时检查版本
onMounted(() => {
  checkVersion()
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">版本检查</h1>
        <p class="text-gray-500 mt-1">检查 OpenClaw 是否有新版本</p>
      </div>
      <button 
        @click="checkVersion"
        :disabled="loading"
        class="btn-primary inline-flex items-center gap-2"
      >
        <RefreshCw 
          class="w-4 h-4" 
          :class="{ 'animate-spin': loading }" 
        />
        检查更新
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-500" />
      <div>
        <p class="font-medium text-red-900">错误</p>
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">检查版本中...</p>
    </div>

    <!-- Version Info -->
    <div v-else-if="versionInfo" class="max-w-2xl">
      <!-- 当前版本 -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">当前版本</h2>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
            <span class="text-2xl">🔧</span>
          </div>
          <div>
            <p class="text-3xl font-bold text-gray-900">{{ versionInfo.currentVersion }}</p>
            <p class="text-gray-500">当前安装的版本</p>
          </div>
        </div>
      </div>

      <!-- 最新版本 -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">最新版本</h2>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
            <span class="text-2xl">📦</span>
          </div>
          <div>
            <p class="text-3xl font-bold text-gray-900">{{ versionInfo.latestVersion }}</p>
            <p class="text-gray-500">npm 仓库中的最新版本</p>
          </div>
        </div>
      </div>

      <!-- 更新状态 -->
      <div v-if="versionInfo.updateAvailable" class="card p-6 border-green-200 bg-green-50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Download class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-green-900">发现新版本！</p>
            <p class="text-sm text-green-700">有新版本可用，点击下方按钮更新</p>
          </div>
          <button 
            @click="updateOpenClaw"
            :disabled="updating"
            class="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw v-if="updating" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ updating ? '更新中...' : '更新版本' }}
          </button>
        </div>
      </div>

      <div v-else-if="versionInfo.currentVersion !== 'unknown'" class="card p-6 border-green-200 bg-green-50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="font-semibold text-green-900">已是最新版本</p>
            <p class="text-sm text-green-700">当前安装的已是最新版本</p>
          </div>
        </div>
      </div>

      <div v-else class="card p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <p class="font-semibold text-gray-900">无法确定版本</p>
            <p class="text-sm text-gray-500">请确保已正确安装 OpenClaw</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 手动输入版本检查 -->
    <div class="mt-8 card p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">其他版本检查方式</h2>
      <p class="text-sm text-gray-500 mb-4">
        你也可以通过以下命令检查版本：
      </p>
      <div class="bg-gray-900 rounded-lg p-4">
        <code class="text-green-400 text-sm">
          # 查看当前版本<br/>
          openclaw --version<br/><br/>
          
          # 检查 npm 最新版本<br/>
          npm view openclaw version<br/><br/>
          
          # 更新到最新版本<br/>
          npm install -g openclaw
        </code>
      </div>
    </div>
  </div>
</template>
