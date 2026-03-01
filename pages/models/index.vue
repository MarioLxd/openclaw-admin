<script setup lang="ts">
import { Plus, Trash2, RefreshCw, AlertCircle, ExternalLink, Search, Key, Eye, EyeOff, Check, X } from 'lucide-vue-next'

const store = useOpenClawStore()

// ==================== 禁用模型管理 ====================

// 禁用的模型列表（从单独的配置文件读取）
const disabledModels = ref<string[]>([])

// 加载禁用的模型列表
const loadDisabledModels = async () => {
  try {
    const response = await $fetch('/api/models/disabled')
    if (response.ok && response.result) {
      disabledModels.value = response.result
    }
  } catch (e) {
    // ignore
  }
}

// 检查模型是否被禁用
const isModelDisabled = (providerId: string, modelId: string) => {
  return disabledModels.value.includes(`${providerId}/${modelId}`)
}

// 页面加载时获取配置和凭据
onMounted(async () => {
  if (!store.config) {
    await store.loadConfig()
  }
  await store.loadCredentials()
  await loadDisabledModels()
})

const refreshModels = async () => {
  await store.loadConfig()
  await store.loadCredentials()
}

// 预设的模型提供商
const presetProviders = [
  { id: 'moonshot', name: 'Moonshot (月之暗面)', baseUrl: 'https://api.moonshot.cn/v1', api: 'openai-completions' },
  { id: 'minimax-cn', name: 'MiniMax (稀宇科技)', baseUrl: 'https://api.minimaxi.com/anthropic', api: 'anthropic-messages' },
  { id: 'zhipu', name: '智谱 AI (GLM)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4/', api: 'openai-completions' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', api: 'openai-chat' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', api: 'anthropic-messages' },
  { id: 'ollama', name: 'Ollama (本地)', baseUrl: 'http://localhost:11434/v1', api: 'openai-chat' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', api: 'openai-chat' },
  { id: 'qwen', name: '通义千问 (Qwen)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', api: 'openai-chat' },
]

// 预设的模型（按提供商分组）
const presetModels: Record<string, Array<{ id: string; name: string; contextWindow?: number; maxTokens?: number; reasoning?: boolean }>> = {
  'moonshot': [
    { id: 'kimi-k2.5', name: 'Kimi K2.5', contextWindow: 256000, maxTokens: 8192, reasoning: false },
    { id: 'kimi-k2', name: 'Kimi K2', contextWindow: 200000, maxTokens: 8192, reasoning: true },
    { id: 'kimi-latest', name: 'Kimi Latest', contextWindow: 256000, maxTokens: 8192 },
  ],
  'minimax-cn': [
    { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', contextWindow: 200000, maxTokens: 8192, reasoning: true },
    { id: 'MiniMax-Text-01', name: 'MiniMax Text 01', contextWindow: 1000000, maxTokens: 8192 },
  ],
  'zhipu': [
    { id: 'glm-5', name: 'GLM-5', contextWindow: 128000, maxTokens: 8192, reasoning: true },
    { id: 'glm-4', name: 'GLM-4', contextWindow: 128000, maxTokens: 8192 },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', contextWindow: 128000, maxTokens: 8192 },
  ],
  'openai': [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxTokens: 16384 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxTokens: 16384 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, maxTokens: 4096 },
    { id: 'gpt-4', name: 'GPT-4', contextWindow: 8192, maxTokens: 4096 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxTokens: 4096 },
    { id: 'o1', name: 'o1 (推理)', contextWindow: 128000, maxTokens: 100000, reasoning: true },
    { id: 'o1-mini', name: 'o1-mini (推理)', contextWindow: 128000, maxTokens: 65000, reasoning: true },
  ],
  'anthropic': [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxTokens: 8192 },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxTokens: 8192 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, maxTokens: 4096 },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000, maxTokens: 4096 },
  ],
  'ollama': [
    { id: 'llama3', name: 'Llama 3' },
    { id: 'llama3.1', name: 'Llama 3.1' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'mixtral', name: 'Mixtral' },
    { id: 'qwen2', name: 'Qwen2' },
    { id: 'phi3', name: 'Phi-3' },
  ],
  'deepseek': [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: 64000, maxTokens: 4096 },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', contextWindow: 16000, maxTokens: 4096 },
  ],
  'qwen': [
    { id: 'qwen-turbo', name: 'Qwen Turbo', contextWindow: 100000, maxTokens: 4096 },
    { id: 'qwen-plus', name: 'Qwen Plus', contextWindow: 30000, maxTokens: 4096 },
    { id: 'qwen-max', name: 'Qwen Max', contextWindow: 8000, maxTokens: 4096 },
    { id: 'qwen-long', name: 'Qwen Long', contextWindow: 1000000, maxTokens: 4096 },
  ],
}

// API 类型选项
const apiTypes = [
  { value: 'openai-completions', label: 'OpenAI Completions' },
  { value: 'anthropic-messages', label: 'Anthropic Messages' },
  { value: 'openai-chat', label: 'OpenAI Chat (兼容)' },
]

// ==================== 提供商 + API Key 管理 ====================

// 添加提供商 Modal
const showAddProviderModal = ref(false)
const newProvider = ref({
  id: '',
  name: '',
  baseUrl: '',
  api: 'openai-completions',
  apiKey: '',  // 新增：API Key
})

// 选择预设提供商
const selectPresetProvider = (preset: typeof presetProviders[0]) => {
  newProvider.value.id = preset.id
  newProvider.value.name = preset.name
  newProvider.value.baseUrl = preset.baseUrl
  newProvider.value.api = preset.api
}

const addProvider = async () => {
  if (!newProvider.value.id || !store.config) return
  
  const providerId = newProvider.value.id.toLowerCase()
  
  const updatedModels = { ...store.config.models }
  if (!updatedModels.providers) {
    updatedModels.providers = {}
  }
  
  updatedModels.providers[providerId] = {
    baseUrl: newProvider.value.baseUrl,
    api: newProvider.value.api,
    models: [],
  }
  
  const result = await store.saveConfigPatch({ models: updatedModels })
  if (result) {
    // 如果填写了 API Key，同时保存
    if (newProvider.value.apiKey) {
      await store.saveCredential(providerId, newProvider.value.apiKey)
    }
    
    showAddProviderModal.value = false
    newProvider.value = { id: '', name: '', baseUrl: '', api: 'openai-completions', apiKey: '' }
    await refreshModels()
  }
}

// 删除提供商（同时删除 API Key）
const deleteProvider = async (providerId: string) => {
  if (!confirm(`确定要删除提供商 "${providerId}" 吗？相关的 API Key 也会被删除。此操作不可恢复。`)) return
  if (!store.config) return
  
  const updatedModels = { ...store.config.models }
  delete updatedModels.providers?.[providerId]
  
  const result = await store.saveConfigPatch({ models: updatedModels })
  if (result) {
    // 同时删除 API Key
    const cred = store.getCredential(providerId)
    if (cred) {
      await store.deleteCredential(cred.name)
    }
    await refreshModels()
  }
}

// ==================== API Key 编辑（行内） ====================

const editingApiKey = ref<string | null>(null)
const editingApiKeyValue = ref('')
const savingApiKey = ref(false)
const showApiKey = ref<Record<string, boolean>>({})

// 开始编辑 API Key
const startEditApiKey = (providerId: string) => {
  editingApiKey.value = providerId
  editingApiKeyValue.value = ''
}

// 取消编辑
const cancelEditApiKey = () => {
  editingApiKey.value = null
  editingApiKeyValue.value = ''
}

// 保存 API Key
const saveApiKey = async (providerId: string) => {
  if (!editingApiKeyValue.value) return
  
  savingApiKey.value = true
  const result = await store.saveCredential(providerId, editingApiKeyValue.value)
  savingApiKey.value = false
  
  if (result) {
    editingApiKey.value = null
    editingApiKeyValue.value = ''
    await store.loadCredentials()
  }
}

// 删除 API Key
const removeApiKey = async (providerId: string) => {
  if (!confirm(`确定要删除 ${providerId} 的 API Key 吗？`)) return
  
  const cred = store.getCredential(providerId)
  if (cred) {
    await store.deleteCredential(cred.name)
  }
}

// 切换显示/隐藏 API Key（这里只显示掩码后的）
const toggleShowApiKey = (providerId: string) => {
  showApiKey.value[providerId] = !showApiKey.value[providerId]
}

// ==================== 模型管理 ====================

// 添加模型 Modal
const showAddModelModal = ref(false)
const currentProviderId = ref('')
const selectedPresetModel = ref('')
const newModel = ref({
  id: '',
  name: '',
  reasoning: false,
  contextWindow: undefined as number | undefined,
  maxTokens: undefined as number | undefined,
})

// 根据选择填充预设模型
const fillPresetModel = () => {
  if (!currentProviderId.value || !selectedPresetModel.value) return
  
  const models = presetModels[currentProviderId.value] || []
  const preset = models.find(m => m.id === selectedPresetModel.value)
  
  if (preset) {
    newModel.value.id = preset.id
    newModel.value.name = preset.name
    newModel.value.contextWindow = preset.contextWindow
    newModel.value.maxTokens = preset.maxTokens
    newModel.value.reasoning = preset.reasoning || false
  }
}

// 打开添加模型
const openAddModel = (providerId: string) => {
  currentProviderId.value = providerId
  selectedPresetModel.value = ''
  newModel.value = {
    id: '',
    name: '',
    reasoning: false,
    contextWindow: undefined,
    maxTokens: undefined,
  }
  showAddModelModal.value = true
}

// 获取当前提供商的预设模型
const currentPresetModels = computed(() => {
  return presetModels[currentProviderId.value] || []
})

const addModel = async () => {
  if (!newModel.value.id || !currentProviderId.value || !store.config) return
  
  const updatedModels = { ...store.config.models }
  if (!updatedModels.providers?.[currentProviderId.value]) return
  
  const newModelObj: any = {
    id: newModel.value.id,
    name: newModel.value.name || newModel.value.id,
    reasoning: newModel.value.reasoning,
    input: ['text'],
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    },
  }
  
  if (newModel.value.contextWindow) {
    newModelObj.contextWindow = newModel.value.contextWindow
  }
  if (newModel.value.maxTokens) {
    newModelObj.maxTokens = newModel.value.maxTokens
  }
  
  updatedModels.providers[currentProviderId.value].models.push(newModelObj)
  
  const result = await store.saveConfigPatch({ models: updatedModels })
  if (result) {
    showAddModelModal.value = false
    newModel.value = { id: '', name: '', reasoning: false, contextWindow: undefined, maxTokens: undefined }
    currentProviderId.value = ''
    await store.loadConfig()
  }
}

// 删除模型
const deleteModel = async (providerId: string, modelId: string) => {
  if (!confirm(`确定要删除模型 "${modelId}" 吗？`)) return
  if (!store.config) return
  
  const updatedModels = { ...store.config.models }
  if (!updatedModels.providers?.[providerId]) return
  
  updatedModels.providers[providerId].models = 
    updatedModels.providers[providerId].models.filter((m: any) => m.id !== modelId)
  
  const result = await store.saveConfigPatch({ models: updatedModels })
  if (result) {
    await store.loadConfig()
  }
}

// 切换模型启用/禁用状态
const toggleModel = async (providerId: string, modelId: string) => {
  // 计算当前状态
  const key = `${providerId}/${modelId}`
  const isCurrentlyDisabled = disabledModels.value.includes(key)
  const newDisabledState = !isCurrentlyDisabled
  
  try {
    // 1. 更新禁用状态
    const response = await $fetch('/api/models/disabled', {
      method: 'POST',
      body: { 
        providerId, 
        modelId, 
        disabled: newDisabledState 
      },
    })
    
    if (response.ok) {
      // 2. 更新本地状态
      if (newDisabledState) {
        disabledModels.value.push(key)
      } else {
        disabledModels.value = disabledModels.value.filter(k => k !== key)
      }
      
      // 3. 更新 OpenClaw 的 fallback 列表（移除或添加）
      await updateOpenClawFallbacks(providerId, modelId, newDisabledState)
    }
  } catch (e: any) {
    alert('操作失败: ' + e.message)
  }
}

// 更新 OpenClaw 的 fallback 配置
const updateOpenClawFallbacks = async (providerId: string, modelId: string, disabled: boolean) => {
  if (!store.config) return
  
  const modelKey = `${providerId}/${modelId}`
  const currentDefaults = { ...store.config.agents.defaults }
  const currentFallbacks = currentDefaults.model?.fallbacks || []
  
  if (disabled) {
    // 禁用：从 fallback 列表中移除
    const newFallbacks = currentFallbacks.filter((f: string) => f !== modelKey)
    
    // 如果是主模型，需要切换到第一个可用的 fallback
    if (currentDefaults.model?.primary === modelKey) {
      const availableFallbacks = newFallbacks.filter((f: string) => 
        !disabledModels.value.includes(f) || f === modelKey
      )
      if (availableFallbacks.length > 0) {
        currentDefaults.model.primary = availableFallbacks[0]
        currentDefaults.model.fallbacks = availableFallbacks.slice(1)
      }
    } else {
      currentDefaults.model = {
        ...currentDefaults.model,
        fallbacks: newFallbacks
      }
    }
  } else {
    // 启用：添加回 fallback 列表
    if (!currentFallbacks.includes(modelKey)) {
      currentDefaults.model = {
        ...currentDefaults.model,
        fallbacks: [...currentFallbacks, modelKey]
      }
    }
  }
  
  // 保存到 OpenClaw 配置
  await store.saveConfigPatch({
    agents: {
      ...store.config.agents,
      defaults: currentDefaults
    }
  })
}

// ==================== 搜索 ====================
const searchQuery = ref('')

const filteredProviders = computed(() => {
  if (!searchQuery.value) return store.modelProviders
  const query = searchQuery.value.toLowerCase()
  return store.modelProviders.filter(p => 
    p.id.toLowerCase().includes(query) ||
    p.models.some((m: any) => m.name?.toLowerCase().includes(query) || m.id?.toLowerCase().includes(query))
  )
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">模型配置</h1>
        <p class="text-gray-500 mt-1">管理 AI 模型提供商、API Key 和模型配置</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="refreshModels"
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
          @click="showAddProviderModal = true"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          添加提供商
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

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          autocomplete="off"
          placeholder="搜索提供商或模型..."
          class="input pl-10"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>

    <!-- Providers List -->
    <div v-else class="space-y-6">
      <div
        v-for="provider in filteredProviders"
        :key="provider.id"
        class="card overflow-hidden"
      >
        <!-- Provider Header -->
        <div class="p-6 border-b border-gray-200 bg-gray-50/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <span class="text-primary-700 font-bold text-lg">{{ provider.id[0].toUpperCase() }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-900">{{ provider.id }}</h3>
                  <!-- API Key 状态标签 -->
                  <span
                    v-if="provider.hasApiKey"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    <Key class="w-3 h-3 mr-1" />
                    已配置 Key
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    <Key class="w-3 h-3 mr-1" />
                    未配置 Key
                  </span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span>{{ provider.models.length }} 个模型</span>
                  <span>·</span>
                  <span class="font-mono text-xs">{{ provider.api }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a 
                :href="provider.baseUrl" 
                target="_blank"
                class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="打开 Base URL"
              >
                <ExternalLink class="w-4 h-4 text-gray-500" />
              </a>
              <button 
                @click="deleteProvider(provider.id)"
                class="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="删除"
              >
                <Trash2 class="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
          <div class="mt-3 text-sm text-gray-500">
            <span class="font-mono">{{ provider.baseUrl }}</span>
          </div>
          
          <!-- API Key 管理区域 -->
          <div class="mt-4 pt-4 border-t border-gray-200" @click.stop>
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <label class="text-sm font-medium text-gray-700 mb-1 block">API Key</label>
                <!-- 已有 Key 时显示 -->
                <div v-if="provider.hasApiKey && editingApiKey !== provider.id" class="flex items-center gap-2">
                  <div class="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <Key class="w-4 h-4" />
                    <span>已配置 API Key</span>
                    <span v-if="store.getCredential(provider.id)?.source === 'env'" class="text-green-500">(通过环境变量)</span>
                    <span v-else-if="store.getCredential(provider.id)?.source === 'auth'" class="text-green-500">(通过 auth 配置)</span>
                    <span v-else class="text-green-500">(点击"更新"可修改)</span>
                  </div>
                  <button 
                    type="button"
                    @click.stop="startEditApiKey(provider.id)"
                    class="btn-secondary text-sm px-3 py-2"
                  >
                    更新
                  </button>
                  <button 
                    type="button"
                    @click.stop="removeApiKey(provider.id)"
                    class="text-red-600 hover:text-red-700 text-sm px-2"
                  >
                    删除
                  </button>
                </div>
                <!-- 编辑中 -->
                <div v-else-if="editingApiKey === provider.id" class="flex items-center gap-2">
                  <input 
                    v-model="editingApiKeyValue"
                    type="password"
                    class="input flex-1"
                    placeholder="输入新的 API Key"
                    @click.stop
                    autofocus
                  />
                  <button 
                    type="button"
                    @click.stop="saveApiKey(provider.id)"
                    :disabled="!editingApiKeyValue || savingApiKey"
                    class="btn-primary text-sm px-3 py-2 disabled:opacity-50"
                  >
                    <Check v-if="!savingApiKey" class="w-4 h-4" />
                    <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  </button>
                  <button 
                    type="button"
                    @click.stop="cancelEditApiKey"
                    class="btn-secondary text-sm px-3 py-2"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <!-- 未配置 Key 时显示按钮 -->
                <div v-else class="flex items-center gap-2">
                  <div class="flex-1 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle class="w-4 h-4" />
                    <span>未配置 API Key</span>
                  </div>
                  <button 
                    type="button"
                    @click.stop="startEditApiKey(provider.id)"
                    class="btn-primary text-sm px-3 py-2"
                  >
                    配置 Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Models Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型 ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">推理</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">上下文窗口</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最大 Tokens</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="model in provider.models" :key="model.id" :class="{ 'bg-gray-50 opacity-60': isModelDisabled(provider.id, model.id) }">
                <td class="px-6 py-4">
                  <button 
                    @click="toggleModel(provider.id, model.id)"
                    :class="[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      !isModelDisabled(provider.id, model.id) ? 'bg-green-600' : 'bg-gray-300'
                    ]"
                    :title="isModelDisabled(provider.id, model.id) ? '点击启用' : '点击禁用'"
                  >
                    <span 
                      :class="[
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        !isModelDisabled(provider.id, model.id) ? 'translate-x-6' : 'translate-x-1'
                      ]" 
                    />
                  </button>
                </td>
                <td class="px-6 py-4">
                  <span :class="['font-medium', !isModelDisabled(provider.id, model.id) ? 'text-gray-900' : 'text-gray-400']">
                    {{ model.name }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ model.id }}</code>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      model.reasoning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ model.reasoning ? '支持' : '不支持' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-600">
                  {{ model.contextWindow ? model.contextWindow.toLocaleString() : '-' }}
                </td>
                <td class="px-6 py-4 text-gray-600">
                  {{ model.maxTokens ? model.maxTokens.toLocaleString() : '-' }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button 
                    @click="deleteModel(provider.id, model.id)"
                    class="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    删除
                  </button>
                </td>
              </tr>
              <tr v-if="provider.models.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                  暂无模型，点击下方添加模型
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add Model Button -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button 
            @click="openAddModel(provider.id)"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            <Plus class="w-4 h-4" />
            添加模型
          </button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredProviders.length === 0" class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">暂无模型提供商</h3>
        <p class="text-gray-500">点击上方按钮添加提供商</p>
      </div>
    </div>

    <!-- 添加提供商 Modal -->
    <div v-if="showAddProviderModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 class="text-lg font-semibold text-gray-900">添加模型提供商</h3>
          <p class="text-sm text-gray-500 mt-1">一键完成提供商配置和 API Key 设置</p>
        </div>
        <div class="p-6 space-y-4">
          <!-- 预设选择 -->
          <div>
            <label class="label">快速选择（推荐）</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="preset in presetProviders"
                :key="preset.id"
                @click="selectPresetProvider(preset)"
                :class="[
                  'p-3 text-left rounded-lg border transition-all',
                  newProvider.id === preset.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <div class="font-medium text-sm">{{ preset.name }}</div>
                <div class="text-xs text-gray-500 truncate">{{ preset.baseUrl }}</div>
              </button>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <label class="label">或手动输入</label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <input 
                  v-model="newProvider.id" 
                  type="text" 
                  class="input" 
                  placeholder="提供商 ID" 
                />
              </div>
              <div>
                <select v-model="newProvider.api" class="input">
                  <option v-for="t in apiTypes" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="mt-4">
              <input 
                v-model="newProvider.baseUrl" 
                type="text" 
                class="input" 
                placeholder="Base URL (例如: https://api.example.com/v1)" 
              />
            </div>
          </div>

          <!-- API Key 输入（新增） -->
          <div class="border-t border-gray-200 pt-4">
            <label class="label">
              API Key
              <span class="text-gray-400 font-normal">(可选，也可以稍后配置)</span>
            </label>
            <input 
              v-model="newProvider.apiKey"
              type="password"
              class="input"
              placeholder="输入 API Key (可选)"
            />
            <p class="text-xs text-gray-500 mt-1">
              现在填写 API Key 可以一步完成配置，也可以稍后在提供商卡片中配置
            </p>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button @click="showAddProviderModal = false; newProvider = { id: '', name: '', baseUrl: '', api: 'openai-completions', apiKey: '' }" class="btn-secondary">取消</button>
          <button 
            @click="addProvider" 
            :disabled="!newProvider.id || !newProvider.baseUrl"
            class="btn-primary disabled:opacity-50"
          >
            添加提供商
          </button>
        </div>
      </div>
    </div>

    <!-- 添加模型 Modal -->
    <div v-if="showAddModelModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">添加模型</h3>
          <p class="text-sm text-gray-500 mt-1">为 {{ currentProviderId }} 添加模型</p>
        </div>
        <div class="p-6 space-y-4">
          <!-- 预设选择 -->
          <div v-if="currentPresetModels.length > 0">
            <label class="label">从预设选择（推荐）</label>
            <select 
              v-model="selectedPresetModel" 
              class="input"
              @change="fillPresetModel"
            >
              <option value="">-- 选择预设模型 --</option>
              <option v-for="model in currentPresetModels" :key="model.id" :value="model.id">
                {{ model.name }} ({{ model.id }})
              </option>
            </select>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <label class="label">或手动输入模型 ID</label>
            <input 
              v-model="newModel.id" 
              type="text" 
              class="input" 
              placeholder="例如: gpt-4, claude-3" 
            />
          </div>

          <div>
            <label class="label">显示名称（可选）</label>
            <input 
              v-model="newModel.name" 
              type="text" 
              class="input" 
              placeholder="留空则使用模型 ID" 
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">上下文窗口（可选）</label>
              <input 
                v-model.number="newModel.contextWindow" 
                type="number" 
                class="input" 
                placeholder="未知可留空" 
              />
            </div>
            <div>
              <label class="label">最大 Tokens（可选）</label>
              <input 
                v-model.number="newModel.maxTokens" 
                type="number" 
                class="input" 
                placeholder="未知可留空" 
              />
            </div>
          </div>

          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="newModel.reasoning" type="checkbox" class="w-4 h-4 text-primary-600 border-gray-300 rounded" />
            <span class="text-sm text-gray-700">支持推理模型 (Reasoning)</span>
          </label>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button @click="showAddModelModal = false" class="btn-secondary">取消</button>
          <button 
            @click="addModel" 
            :disabled="!newModel.id"
            class="btn-primary disabled:opacity-50"
          >
            添加模型
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
