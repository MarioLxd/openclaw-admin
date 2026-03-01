<script setup lang="ts">
import { Plus, Trash2, Bot, MessageSquare, RefreshCw, AlertCircle } from 'lucide-vue-next'

const store = useOpenClawStore()
const api = useOpenClawApi()

// 页面加载时获取配置
onMounted(() => {
  if (!store.config) {
    store.loadConfig()
  }
})

const refreshBindings = async () => {
  await store.loadConfig()
}

const getAgentInfo = (agentId: string) => {
  return store.agents.find(a => a.id === agentId) || { name: agentId, emoji: '🤖', id: agentId }
}

const deleteBinding = async (index: number) => {
  if (!confirm('确定要删除这个绑定关系吗？')) return
  
  if (!store.config) return
  
  const newBindings = [...store.config.bindings]
  newBindings.splice(index, 1)
  
  await store.saveConfigPatch({ bindings: newBindings })
}

const showAddModal = ref(false)
const newBinding = ref({
  agentId: '',
  channel: '',
  accountId: ''
})

const availableAccounts = computed(() => {
  const channel = store.channels.find(c => c.id === newBinding.value.channel)
  if (!channel) return []
  return Object.entries(channel.accounts || {}).map(([id, account]) => ({
    id,
    ...account
  }))
})

const addBinding = async () => {
  if (!newBinding.value.agentId || !newBinding.value.channel || !newBinding.value.accountId) return
  
  if (!store.config) return
  
  const newBindingObj = {
    agentId: newBinding.value.agentId,
    match: {
      channel: newBinding.value.channel,
      accountId: newBinding.value.accountId
    }
  }
  
  const newBindings = [...store.config.bindings, newBindingObj]
  
  const result = await store.saveConfigPatch({ bindings: newBindings })
  if (result) {
    showAddModal.value = false
    newBinding.value = { agentId: '', channel: '', accountId: '' }
  }
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">绑定管理</h1>
        <p class="text-gray-500 mt-1">管理 Agent 与渠道的绑定关系</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="refreshBindings"
          :disabled="store.loading"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': store.loading }" 
          />
          刷新
        </button>
        <button 
          @click="showAddModal = true"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          新建绑定
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

    <!-- Bindings Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(binding, index) in store.bindings"
        :key="index"
        class="card p-6"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ getAgentInfo(binding.agentId).emoji }}</span>
            <div>
              <h3 class="font-semibold text-gray-900">{{ getAgentInfo(binding.agentId).name }}</h3>
              <p class="text-sm text-gray-500">{{ binding.agentId }}</p>
            </div>
          </div>
          <button 
            @click="deleteBinding(index)"
            class="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4 text-red-500" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <Bot class="w-4 h-4" />
              <span>Agent</span>
            </div>
            <div class="flex-1 h-px bg-gray-200" />
            <span class="font-medium text-gray-900">{{ binding.agentId }}</span>
          </div>

          <div class="flex justify-center">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-600 text-lg">↔</span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare class="w-4 h-4" />
              <span>渠道</span>
            </div>
            <div class="flex-1 h-px bg-gray-200" />
            <div class="text-right">
              <span class="font-medium text-gray-900">{{ binding.match.channel }}</span>
              <p class="text-xs text-gray-500">{{ binding.match.accountId }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">新建绑定</h3>
          <p class="text-sm text-gray-500 mt-1">将 Agent 绑定到渠道账号</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="label">选择 Agent</label>
            <select v-model="newBinding.agentId" class="input">
              <option value="">请选择</option>
              <option v-for="agent in store.agents" :key="agent.id" :value="agent.id">
                {{ agent.identity.emoji }} {{ agent.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">选择渠道</label>
            <select v-model="newBinding.channel" class="input">
              <option value="">请选择</option>
              <option v-for="channel in store.channels" :key="channel.id" :value="channel.id">
                {{ channel.id }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">选择账号</label>
            <select v-model="newBinding.accountId" class="input" :disabled="!newBinding.channel">
              <option value="">请选择</option>
              <option v-for="account in availableAccounts" :key="account.id" :value="account.id">
                {{ account.botName }}
              </option>
            </select>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button 
            @click="showAddModal = false"
            class="btn-secondary"
          >
            取消
          </button>
          <button 
            @click="addBinding"
            :disabled="!newBinding.agentId || !newBinding.channel || !newBinding.accountId"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建绑定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
