<script setup lang="ts">
import { Plus, Search, Edit2, Trash2, RefreshCw, AlertCircle, FolderOpen, CheckCircle, XCircle, MessageSquare, Clock, Folder, FileCode } from 'lucide-vue-next'

const store = useOpenClawStore()
const api = useOpenClawApi()
const router = useRouter()

// Agent 状态数据
const agentStatus = ref<Record<string, any>>({})
const loadingStatus = ref(false)

// 页面加载时获取配置和状态
onMounted(async () => {
  if (!store.config) {
    await store.loadConfig()
  }
  await loadAgentStatus()
})

// 加载 Agent 状态
const loadAgentStatus = async () => {
  loadingStatus.value = true
  try {
    const response = await $fetch('/api/agents/status')
    if (response.ok && response.result) {
      agentStatus.value = response.result
    }
  } catch (e) {
    console.error('Failed to load agent status:', e)
  }
  loadingStatus.value = false
}

const refreshAll = async () => {
  await store.loadConfig()
  await loadAgentStatus()
}

const searchQuery = ref('')

const filteredAgents = computed(() => {
  if (!searchQuery.value) return store.agents
  const query = searchQuery.value.toLowerCase()
  return store.agents.filter(agent => 
    agent.name.toLowerCase().includes(query) ||
    agent.id.toLowerCase().includes(query) ||
    agent.identity?.name?.toLowerCase().includes(query)
  )
})

// 获取 Agent 状态
const getAgentStatus = (agentId: string) => {
  return agentStatus.value[agentId] || {}
}

// 删除 Agent
const deleteAgent = async (id: string) => {
  if (!confirm(`确定要删除 Agent "${id}" 吗？此操作只会从配置中移除，不会删除工作目录。`)) return
  
  const result = await api.deleteAgent(id)
  if (result.ok) {
    await refreshAll()
  } else {
    alert('删除失败: ' + result.error)
  }
}

// 打开工作目录
const openWorkspace = (workspace: string) => {
  const path = workspace.replace('~', '~')
  // 通过 API 打开目录
  $fetch('/api/utils/open-folder', {
    method: 'POST',
    body: { path },
  }).catch(() => {
    alert(`工作目录: ${path}`)
  })
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Agent 管理</h1>
        <p class="text-gray-500 mt-1">管理 OpenClaw 的所有 Agent 配置</p>
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
        <NuxtLink to="/agents/new" class="btn-primary inline-flex items-center gap-2">
          <Plus class="w-4 h-4" />
          新建 Agent
        </NuxtLink>
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

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          autocomplete="off"
          placeholder="搜索 Agent..."
          class="input pl-10"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>

    <!-- Agents Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="agent in filteredAgents"
        :key="agent.id"
        class="card p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-3xl">{{ agent.identity?.emoji || '🤖' }}</span>
            <div>
              <h3 class="font-semibold text-gray-900">{{ agent.name }}</h3>
              <p class="text-sm text-gray-500">@{{ agent.id }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <NuxtLink 
              :to="`/agents/edit/${agent.id}`"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="编辑"
            >
              <Edit2 class="w-4 h-4 text-gray-500" />
            </NuxtLink>
            <button 
              v-if="!agent.default"
              @click="deleteAgent(agent.id)"
              class="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 class="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">显示名称</span>
            <span class="font-medium text-gray-900">{{ agent.identity?.name || '-' }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">默认模型</span>
            <span class="font-medium text-primary-600 text-xs truncate max-w-[120px]">{{ agent.model?.primary || '-' }}</span>
          </div>
          
          <!-- 工作目录状态 -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 flex items-center gap-1">
              <Folder class="w-3 h-3" />
              工作目录
            </span>
            <span
              v-if="getAgentStatus(agent.id).workspaceExists"
              class="inline-flex items-center text-green-600"
            >
              <CheckCircle class="w-3 h-3 mr-1" />
              已创建
            </span>
            <span
              v-else
              class="inline-flex items-center text-yellow-600"
            >
              <XCircle class="w-3 h-3 mr-1" />
              未创建
            </span>
          </div>
          
          <!-- 会话数 -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 flex items-center gap-1">
              <MessageSquare class="w-3 h-3" />
              会话数
            </span>
            <span class="font-medium text-gray-900">{{ getAgentStatus(agent.id).sessionsCount || 0 }}</span>
          </div>
          
          <!-- 最近活动 -->
          <div v-if="getAgentStatus(agent.id).lastActivity" class="flex items-center justify-between text-sm">
            <span class="text-gray-500 flex items-center gap-1">
              <Clock class="w-3 h-3" />
              最近活动
            </span>
            <span class="text-xs text-gray-600">
              {{ new Date(getAgentStatus(agent.id).lastActivity).toLocaleDateString() }}
            </span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span
            v-if="agent.default"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
          >
            默认 Agent
          </span>
          <span
            v-else
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            普通 Agent
          </span>
          
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="`/agents/kernels/${agent.id}`"
              class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="内核配置"
            >
              <FileCode class="w-4 h-4 text-gray-500" />
            </NuxtLink>
            <button
              @click="openWorkspace(agent.workspace)"
              class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="打开工作目录"
            >
              <FolderOpen class="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!store.loading && filteredAgents.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">没有找到 Agent</h3>
      <p class="text-gray-500">尝试调整搜索条件或创建新的 Agent</p>
      <NuxtLink to="/agents/new" class="btn-primary inline-flex items-center gap-2 mt-4">
        <Plus class="w-4 h-4" />
        新建 Agent
      </NuxtLink>
    </div>
  </div>
</template>
