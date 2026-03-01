<script setup lang="ts">
import { Save, RefreshCw, Shield, Globe, Server, Loader2, AlertCircle, Power, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-vue-next'

const store = useOpenClawStore()
const api = useOpenClawApi()

// Gateway 运行状态
const gatewayStatus = ref<{
  running: boolean
  port: number
  processInfo?: string
} | null>(null)
const loadingStatus = ref(false)

// 页面加载时获取配置和状态
onMounted(async () => {
  if (!store.config) {
    await store.loadConfig()
  }
  await loadGatewayStatus()
})

// 加载 Gateway 状态
const loadGatewayStatus = async () => {
  loadingStatus.value = true
  try {
    const response = await $fetch<any>('/api/status')
    if (response.ok && response.result) {
      gatewayStatus.value = {
        running: response.result.status === 'running',
        port: response.result.gateway?.port || 18789,
        processInfo: response.result.gateway?.processInfo,
      }
    }
  } catch (e) {
    console.error('Failed to load gateway status:', e)
  }
  loadingStatus.value = false
}

// 刷新
const refreshAll = async () => {
  await store.loadConfig()
  await loadGatewayStatus()
}

const isSaving = ref(false)
const isRestarting = ref(false)
const saveMessage = ref('')

// 本地表单状态
const form = computed({
  get: () => store.gatewayConfig || {
    port: 18789,
    mode: 'local',
    bind: 'loopback',
    auth: { mode: 'token', token: '' },
    tailscale: { mode: 'off', resetOnExit: false },
    nodes: { denyCommands: [] }
  },
  set: () => {}
})

const availableModes = [
  { value: 'local', label: '本地模式' },
  { value: 'remote', label: '远程模式' },
]

const bindOptions = [
  { value: 'loopback', label: '仅本地 (127.0.0.1)' },
  { value: 'all', label: '所有接口 (0.0.0.0)' },
]

const tailscaleModes = [
  { value: 'off', label: '关闭' },
  { value: 'on', label: '开启' },
]

const saveConfig = async () => {
  isSaving.value = true
  saveMessage.value = ''
  
  const result = await store.saveConfigPatch({ gateway: form.value })
  
  if (result) {
    saveMessage.value = '配置已保存'
    setTimeout(() => saveMessage.value = '', 3000)
  } else {
    saveMessage.value = '保存失败: ' + store.error
  }
  
  isSaving.value = false
}

const restartGateway = async () => {
  if (!confirm('确定要重启 Gateway 吗？')) return
  
  isRestarting.value = true
  const result = await api.restartGateway()
  
  if (result.ok) {
    // 等待几秒后重新检查状态
    setTimeout(async () => {
      await loadGatewayStatus()
      isRestarting.value = false
    }, 3000)
  } else {
    alert('重启失败: ' + result.error)
    isRestarting.value = false
  }
}

// 启动 Gateway
const isStarting = ref(false)
const startGateway = async () => {
  isStarting.value = true
  try {
    const response = await $fetch('/api/gateway/start', { method: 'POST' })
    if (response.ok) {
      setTimeout(async () => {
        await loadGatewayStatus()
        isStarting.value = false
      }, 3000)
    } else {
      alert('启动失败: ' + response.error)
      isStarting.value = false
    }
  } catch (e: any) {
    alert('启动失败: ' + e.message)
    isStarting.value = false
  }
}

// 停止 Gateway
const isStopping = ref(false)
const stopGateway = async () => {
  if (!confirm('确定要停止 Gateway 吗？')) return
  
  isStopping.value = true
  try {
    const response = await $fetch('/api/gateway/stop', { method: 'POST' })
    if (response.ok) {
      setTimeout(async () => {
        await loadGatewayStatus()
        isStopping.value = false
      }, 2000)
    } else {
      alert('停止失败: ' + response.error)
      isStopping.value = false
    }
  } catch (e: any) {
    alert('停止失败: ' + e.message)
    isStopping.value = false
  }
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gateway 配置</h1>
        <p class="text-gray-500 mt-1">配置和管理 OpenClaw Gateway 服务</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="refreshAll"
          :disabled="store.loading || loadingStatus"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': store.loading || loadingStatus }" 
          />
          刷新
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="store.error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-500" />
      <div>
        <p class="font-medium text-red-900">加载失败</p>
        <p class="text-sm text-red-700">{{ store.error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else class="max-w-3xl space-y-6">
      <!-- Gateway Status Card -->
      <div class="card p-6" :class="gatewayStatus?.running ? 'border-green-200' : 'border-gray-200'">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Server class="w-5 h-5 text-primary-600" />
            <h2 class="text-lg font-semibold text-gray-900">运行状态</h2>
          </div>
          <div class="flex items-center gap-2">
            <!-- 状态指示器 -->
            <span
              v-if="gatewayStatus?.running"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
            >
              <Wifi class="w-4 h-4 mr-1" />
              运行中
            </span>
            <span
              v-else
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600"
            >
              <WifiOff class="w-4 h-4 mr-1" />
              已停止
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500">端口</p>
            <p class="text-xl font-bold text-gray-900">{{ gatewayStatus?.port || form.port }}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500">模式</p>
            <p class="text-xl font-bold text-gray-900">{{ form.mode === 'local' ? '本地' : '远程' }}</p>
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="flex items-center gap-3">
          <button 
            v-if="!gatewayStatus?.running"
            @click="startGateway"
            :disabled="isStarting"
            class="btn-primary inline-flex items-center gap-2"
          >
            <Loader2 v-if="isStarting" class="w-4 h-4 animate-spin" />
            <Power v-else class="w-4 h-4" />
            {{ isStarting ? '启动中...' : '启动 Gateway' }}
          </button>
          <button 
            v-if="gatewayStatus?.running"
            @click="stopGateway"
            :disabled="isStopping"
            class="btn-secondary inline-flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <Loader2 v-if="isStopping" class="w-4 h-4 animate-spin" />
            <XCircle v-else class="w-4 h-4" />
            {{ isStopping ? '停止中...' : '停止' }}
          </button>
          <button 
            v-if="gatewayStatus?.running"
            @click="restartGateway"
            :disabled="isRestarting"
            class="btn-secondary inline-flex items-center gap-2"
          >
            <Loader2 v-if="isRestarting" class="w-4 h-4 animate-spin" />
            <RefreshCw v-else class="w-4 h-4" />
            {{ isRestarting ? '重启中...' : '重启' }}
          </button>
          <a 
            :href="`http://127.0.0.1:${form.port}`" 
            target="_blank"
            class="btn-secondary inline-flex items-center gap-2"
          >
            <Globe class="w-4 h-4" />
            打开控制台
          </a>
        </div>
      </div>

      <!-- Basic Settings -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-6">
          <Server class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">基础配置</h2>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="label">端口</label>
            <input
              v-model.number="form.port"
              type="number"
              class="input"
              placeholder="18789"
            />
          </div>
          <div>
            <label class="label">运行模式</label>
            <select v-model="form.mode" class="input">
              <option v-for="mode in availableModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">绑定地址</label>
            <select v-model="form.bind" class="input">
              <option v-for="opt in bindOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Auth Settings -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-6">
          <Shield class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">认证配置</h2>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">认证模式</label>
            <select v-model="form.auth.mode" class="input">
              <option value="token">Token 认证</option>
              <option value="none">无认证</option>
            </select>
          </div>
          <div v-if="form.auth.mode === 'token'">
            <label class="label">访问 Token</label>
            <div class="flex gap-2">
              <input
                v-model="form.auth.token"
                type="password"
                class="input flex-1"
                placeholder="输入访问 Token"
              />
              <button class="btn-secondary">
                生成新 Token
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tailscale Settings -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-6">
          <Globe class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">Tailscale 配置</h2>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">Tailscale 模式</label>
            <select v-model="form.tailscale.mode" class="input">
              <option v-for="mode in tailscaleModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.tailscale.resetOnExit"
              type="checkbox"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700">退出时重置 Tailscale</span>
          </label>
        </div>
      </div>

      <!-- Node Restrictions -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">节点命令限制</h2>
        <p class="text-sm text-gray-500 mb-4">以下命令将被禁止在节点上执行：</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="cmd in form.nodes.denyCommands"
            :key="cmd"
            class="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {{ cmd }}
          </span>
          <span
            v-if="!form.nodes.denyCommands?.length"
            class="text-gray-400 text-sm"
          >
            无限制
          </span>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex items-center justify-between">
        <p v-if="saveMessage" :class="['text-sm', saveMessage.includes('失败') ? 'text-red-600' : 'text-green-600']">
          {{ saveMessage }}
        </p>
        <div class="flex-1"></div>
        <button 
          @click="saveConfig"
          :disabled="isSaving"
          class="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ isSaving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>
