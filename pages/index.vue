<script setup lang="ts">
import { 
  Bot, 
  MessageSquare, 
  Brain, 
  Server,
  Puzzle,
  Activity,
  RefreshCw,
  AlertCircle,
  Power,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Cpu
} from 'lucide-vue-next'

const store = useOpenClawStore()
const api = useOpenClawApi()

// 健康检查数据
const healthData = ref<any>(null)
const loadingHealth = ref(false)

// 页面加载时获取配置和健康状态
onMounted(async () => {
  await store.loadConfig()
  await loadHealth()
})

// 加载健康状态
const loadHealth = async () => {
  loadingHealth.value = true
  try {
    const response = await $fetch('/api/health')
    if (response.ok) {
      healthData.value = response.result
    }
  } catch (e) {
    console.error('Failed to load health:', e)
  }
  loadingHealth.value = false
}

// 刷新
const refreshAll = async () => {
  await store.loadConfig()
  await loadHealth()
}

// 重启 Gateway
const isRestarting = ref(false)
const restartGateway = async () => {
  if (!confirm('确定要重启 Gateway 吗？')) return
  
  isRestarting.value = true
  const result = await api.restartGateway()
  
  if (result.ok) {
    alert('Gateway 重启信号已发送')
    // 等待几秒后重新检查状态
    setTimeout(() => loadHealth(), 3000)
  } else {
    alert('重启失败: ' + result.error)
  }
  
  isRestarting.value = false
}

// 计算统计数据
const stats = computed(() => [
  { 
    name: 'Agents', 
    value: store.agents.length.toString(), 
    icon: Bot, 
    color: 'bg-blue-500',
    href: '/agents'
  },
  { 
    name: '模型提供商', 
    value: store.modelProviders.length.toString(), 
    icon: Brain, 
    color: 'bg-purple-500',
    href: '/models'
  },
  { 
    name: '渠道', 
    value: store.channels.length.toString(), 
    icon: MessageSquare, 
    color: 'bg-green-500',
    href: '/channels'
  },
  { 
    name: '绑定关系', 
    value: store.bindings.length.toString(), 
    icon: Puzzle, 
    color: 'bg-orange-500',
    href: '/bindings'
  },
])

// 系统状态（从健康检查获取）
const systemStatus = computed(() => {
  const items = []
  
  // Gateway 状态
  items.push({
    name: 'Gateway',
    status: healthData.value?.gateway?.running ? '运行中' : '已停止',
    healthy: healthData.value?.gateway?.running,
    detail: healthData.value?.gateway?.running ? `端口 ${healthData.value?.gateway?.port || 18789}` : '未启动',
    icon: Server,
  })
  
  // 配置状态
  items.push({
    name: '配置文件',
    status: healthData.value?.config?.loaded ? '已加载' : '未找到',
    healthy: healthData.value?.config?.loaded,
    detail: healthData.value?.config?.version || '-',
    icon: Activity,
  })
  
  // 会话统计
  if (healthData.value?.sessions) {
    items.push({
      name: '会话',
      status: `${healthData.value.sessions.total || 0} 个`,
      healthy: true,
      detail: `${healthData.value.sessions.active || 0} 个24h内活跃`,
      icon: Users,
    })
  }
  
  // 版本
  if (healthData.value?.version) {
    items.push({
      name: '版本',
      status: healthData.value.version,
      healthy: true,
      detail: 'OpenClaw',
      icon: Cpu,
    })
  }
  
  return items
})

// 渠道连接状态
const channelStatusList = computed(() => {
  if (!healthData.value?.channels) return []
  
  return Object.entries(healthData.value.channels).map(([id, status]: [string, any]) => ({
    id,
    connected: status?.connected || status?.hasCredentials,
    message: status?.message || (status?.hasCredentials ? '已配置' : '未配置'),
  }))
})

// 最近活动（从配置元数据获取）
const recentActivity = computed(() => {
  const activities = []
  
  if (store.config?.meta?.lastTouchedAt) {
    activities.push({
      action: '配置更新',
      detail: `版本 ${store.config.meta.lastTouchedVersion || '未知'}`,
      time: new Date(store.config.meta.lastTouchedAt).toLocaleString(),
      type: 'success'
    })
  }
  
  if (store.config?.wizard?.lastRunAt) {
    activities.push({
      action: 'Wizard 运行',
      detail: `命令: ${store.config.wizard.lastRunCommand || '未知'}`,
      time: new Date(store.config.wizard.lastRunAt).toLocaleString(),
      type: 'info'
    })
  }
  
  return activities
})

// 运行时间格式化
const formatUptime = (ms: number) => {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天 ${hours % 24}小时`
  if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`
  if (minutes > 0) return `${minutes}分钟`
  return `${seconds}秒`
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p class="text-gray-500 mt-1">OpenClaw 配置管理概览</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="restartGateway"
          :disabled="isRestarting"
          class="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isRestarting" class="w-4 h-4 animate-spin" />
          <Power v-else class="w-4 h-4" />
          {{ isRestarting ? '重启中...' : '重启 Gateway' }}
        </button>
        <button 
          @click="refreshAll"
          :disabled="store.loading || loadingHealth"
          class="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': store.loading || loadingHealth }" 
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

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.name"
        :to="stat.href"
        class="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="flex items-center gap-4">
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', stat.color]">
            <component :is="stat.icon" class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-500">{{ stat.name }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- System Status -->
      <div class="card p-6 lg:col-span-2">
        <div class="flex items-center gap-2 mb-6">
          <Activity class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">系统状态</h2>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div 
            v-for="item in systemStatus" 
            :key="item.name"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <component 
                :is="item.icon" 
                :class="['w-5 h-5', item.healthy ? 'text-green-500' : 'text-red-500']" 
              />
              <div>
                <span class="font-medium text-gray-900">{{ item.name }}</span>
                <p class="text-xs text-gray-500">{{ item.detail }}</p>
              </div>
            </div>
            <span :class="[
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              item.healthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            ]">
              <CheckCircle v-if="item.healthy" class="w-3 h-3 mr-1" />
              <XCircle v-else class="w-3 h-3 mr-1" />
              {{ item.status }}
            </span>
          </div>
        </div>
        
        <!-- 渠道连接状态 -->
        <div v-if="channelStatusList.length > 0" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">渠道连接状态</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="channel in channelStatusList"
              :key="channel.id"
              :class="[
                'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium',
                channel.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              ]"
            >
              <span :class="['w-2 h-2 rounded-full mr-2', channel.connected ? 'bg-green-500' : 'bg-gray-400']" />
              {{ channel.id }}
            </span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-6">
          <Clock class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">最近活动</h2>
        </div>
        <div class="space-y-4">
          <div
            v-for="(activity, index) in recentActivity"
            :key="index"
            class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div :class="[
              'w-2 h-2 rounded-full mt-2',
              activity.type === 'success' ? 'bg-green-500' :
              activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            ]" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900">{{ activity.action }}</p>
              <p class="text-sm text-gray-500 truncate">{{ activity.detail }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ activity.time }}</p>
            </div>
          </div>
          
          <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
            暂无活动记录
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
      <div class="flex flex-wrap gap-4">
        <NuxtLink to="/agents/new" class="btn-primary inline-flex items-center gap-2">
          <Bot class="w-4 h-4" />
          新建 Agent
        </NuxtLink>
        <NuxtLink to="/models" class="btn-secondary inline-flex items-center gap-2">
          <Brain class="w-4 h-4" />
          管理模型
        </NuxtLink>
        <NuxtLink to="/channels" class="btn-secondary inline-flex items-center gap-2">
          <MessageSquare class="w-4 h-4" />
          配置渠道
        </NuxtLink>
        <NuxtLink to="/settings/version" class="btn-secondary inline-flex items-center gap-2">
          <RefreshCw class="w-4 h-4" />
          检查更新
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
