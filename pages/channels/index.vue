<script setup lang="ts">
import { Plus, Trash2, RefreshCw, AlertCircle, X, Check, LogIn, LogOut, Wifi, WifiOff, QrCode } from 'lucide-vue-next'

const store = useOpenClawStore()

// 渠道连接状态
const channelStatus = ref<Record<string, any>>({})
const loadingStatus = ref(false)

// 页面加载时获取配置和状态
onMounted(async () => {
  if (!store.config) {
    await store.loadConfig()
  }
  await loadChannelStatus()
})

const refreshChannels = async () => {
  await store.loadConfig()
  await loadChannelStatus()
}

// 加载渠道状态
const loadChannelStatus = async () => {
  loadingStatus.value = true
  try {
    const response = await $fetch('/api/channels/status')
    if (response.ok) {
      channelStatus.value = response.result || {}
    }
  } catch (e) {
    console.error('Failed to load channel status:', e)
  }
  loadingStatus.value = false
}

// 获取渠道的连接状态
const getChannelConnectionStatus = (channelId: string) => {
  const status = channelStatus.value[channelId]
  if (!status) return null
  
  if (status.connectionStatus) {
    return status.connectionStatus
  }
  
  if (status.hasCredentials) {
    return { connected: true, message: '已配置凭据' }
  }
  
  return { connected: false, message: '未登录' }
}

// 渠道登录
const loggingIn = ref<string | null>(null)

const loginChannel = async (channelId: string, accountId?: string) => {
  loggingIn.value = channelId
  
  try {
    const response = await $fetch('/api/channels/login', {
      method: 'POST',
      body: { channel: channelId, accountId },
    })
    
    if (response.ok) {
      alert(`${channelId} 登录命令已启动，请在终端完成登录流程。`)
    } else {
      alert('登录失败: ' + response.error)
    }
  } catch (e: any) {
    alert('登录失败: ' + e.message)
  }
  
  loggingIn.value = null
}

// 渠道登出
const logoutChannel = async (channelId: string, accountId?: string) => {
  if (!confirm(`确定要登出 ${channelId}${accountId ? `:${accountId}` : ''} 吗？`)) return
  
  try {
    const response = await $fetch('/api/channels/logout', {
      method: 'POST',
      body: { channel: channelId, accountId },
    })
    
    if (response.ok) {
      await loadChannelStatus()
      alert(`已登出 ${channelId}`)
    } else {
      alert('登出失败: ' + response.error)
    }
  } catch (e: any) {
    alert('登出失败: ' + e.message)
  }
}

// 启用/禁用渠道
const toggleChannel = async (channelId: string) => {
  const channel = store.channels.find(c => c.id === channelId)
  if (!channel || !store.config) return
  
  const newEnabled = !channel.enabled
  const updatedChannels = { ...store.config.channels }
  if (updatedChannels[channelId]) {
    updatedChannels[channelId].enabled = newEnabled
  }
  
  const result = await store.saveConfigPatch({ channels: updatedChannels })
  if (result) {
    await store.loadConfig()
  }
}

// 添加渠道
const showAddChannelModal = ref(false)
const newChannel = ref({
  id: '',
  enabled: true,
  dmPolicy: 'pairing',
  capabilities: 'all',
  appId: '',
  appSecret: '',
  encryptKey: '',
  verificationToken: '',
})

const addChannel = async () => {
  if (!newChannel.value.id || !store.config) return
  
  const channelId = newChannel.value.id.toLowerCase()
  const updatedChannels = { ...store.config.channels }
  const existingChannel = updatedChannels[channelId]
  const isFeishu = channelId === 'feishu'
  
  const channelConfig: any = {
    enabled: newChannel.value.enabled,
    dmPolicy: newChannel.value.dmPolicy,
    accounts: existingChannel?.accounts || {},
  }
  
  if (isFeishu) {
    channelConfig.capabilities = newChannel.value.capabilities
    channelConfig.appId = newChannel.value.appId
    channelConfig.appSecret = newChannel.value.appSecret
    channelConfig.encryptKey = newChannel.value.encryptKey
    channelConfig.verificationToken = newChannel.value.verificationToken
  }
  
  updatedChannels[channelId] = channelConfig
  
  const result = await store.saveConfigPatch({ channels: updatedChannels })
  if (result) {
    showAddChannelModal.value = false
    newChannel.value = {
      id: '',
      enabled: true,
      dmPolicy: 'pairing',
      capabilities: 'all',
      appId: '',
      appSecret: '',
      encryptKey: '',
      verificationToken: '',
    }
    await refreshChannels()
  }
}

// 删除渠道
const deleteChannel = async (channelId: string) => {
  if (!confirm(`确定要删除渠道 "${channelId}" 吗？此操作不可恢复。`)) return
  if (!store.config) return
  
  const updatedChannels = { ...store.config.channels }
  delete updatedChannels[channelId]
  
  const result = await store.saveConfigPatch({ channels: updatedChannels })
  if (result) {
    await refreshChannels()
  }
}

// 添加账号
const showAddAccountModal = ref(false)
const currentChannelId = ref('')
const newAccount = ref({
  id: '',
  botName: '',
  appId: '',
  appSecret: '',
  agent: '',
})

const openAddAccount = (channelId: string) => {
  currentChannelId.value = channelId
  showAddAccountModal.value = true
}

const addAccount = async () => {
  if (!newAccount.value.id || !currentChannelId.value || !store.config) return
  
  const updatedChannels = { ...store.config.channels }
  if (!updatedChannels[currentChannelId.value]) return
  
  if (!updatedChannels[currentChannelId.value].accounts) {
    updatedChannels[currentChannelId.value].accounts = {}
  }
  
  updatedChannels[currentChannelId.value].accounts[newAccount.value.id] = {
    botName: newAccount.value.botName,
    appId: newAccount.value.appId,
    appSecret: newAccount.value.appSecret || undefined,
    agent: newAccount.value.agent || undefined,
  }
  
  const result = await store.saveConfigPatch({ channels: updatedChannels })
  if (result) {
    showAddAccountModal.value = false
    newAccount.value = { id: '', botName: '', appId: '', appSecret: '', agent: '' }
    currentChannelId.value = ''
    await store.loadConfig()
  }
}

// 删除账号
const deleteAccount = async (channelId: string, accountId: string) => {
  if (!confirm(`确定要删除账号 "${accountId}" 吗？`)) return
  if (!store.config) return
  
  const updatedChannels = { ...store.config.channels }
  if (!updatedChannels[channelId]?.accounts) return
  
  delete updatedChannels[channelId].accounts[accountId]
  
  const result = await store.saveConfigPatch({ channels: updatedChannels })
  if (result) {
    await store.loadConfig()
  }
}

// 编辑账号
const editingAccount = ref<{ channelId: string; accountId: string } | null>(null)
const editAccountData = ref({ botName: '', appId: '', appSecret: '', agent: '' })

const startEditAccount = (channelId: string, accountId: string, account: any) => {
  editingAccount.value = { channelId, accountId }
  editAccountData.value = {
    botName: account.botName || '',
    appId: account.appId || '',
    appSecret: account.appSecret || '',
    agent: account.agent || '',
  }
}

const saveEditAccount = async () => {
  if (!editingAccount.value || !store.config) return
  
  const { channelId, accountId } = editingAccount.value
  const updatedChannels = { ...store.config.channels }
  
  if (!updatedChannels[channelId]?.accounts?.[accountId]) return
  
  updatedChannels[channelId].accounts[accountId] = {
    botName: editAccountData.value.botName,
    appId: editAccountData.value.appId,
    appSecret: editAccountData.value.appSecret || undefined,
    agent: editAccountData.value.agent || undefined,
  }
  
  const result = await store.saveConfigPatch({ channels: updatedChannels })
  if (result) {
    editingAccount.value = null
    await store.loadConfig()
  }
}

const cancelEditAccount = () => {
  editingAccount.value = null
  editAccountData.value = { botName: '', appId: '', appSecret: '', agent: '' }
}

// DM 策略选项
const dmPolicyOptions = [
  { value: 'open', label: '开放' },
  { value: 'pairing', label: '配对' },
  { value: 'allowlist', label: '白名单' },
]

// 获取可用的 agents
const availableAgents = computed(() => store.agents)

// 需要登录的渠道
const loginRequiredChannels = ['whatsapp', 'telegram', 'signal', 'imessage']
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">渠道配置</h1>
        <p class="text-gray-500 mt-1">管理消息渠道、登录状态和账号绑定</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="refreshChannels"
          :disabled="store.loading || loadingStatus"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': store.loading || loadingStatus }" 
          />
          刷新
        </button>
        <button 
          @click="showAddChannelModal = true"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          添加渠道
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

    <!-- Channels -->
    <div v-else class="space-y-6">
      <div
        v-for="channel in store.channels"
        :key="channel.id"
        class="card overflow-hidden"
      >
        <!-- Channel Header -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-blue-700 font-bold text-lg">{{ channel.id[0].toUpperCase() }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-900">{{ channel.id }}</h3>
                  <!-- 连接状态 -->
                  <span
                    v-if="getChannelConnectionStatus(channel.id)?.connected"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    <Wifi class="w-3 h-3 mr-1" />
                    {{ getChannelConnectionStatus(channel.id)?.message || '已连接' }}
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    <WifiOff class="w-3 h-3 mr-1" />
                    {{ getChannelConnectionStatus(channel.id)?.message || '未连接' }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span>{{ Object.keys(channel.accounts || {}).length }} 个账号</span>
                  <span>·</span>
                  <span>DM 策略: {{ channel.dmPolicy }}</span>
                  <span>·</span>
                  <span :class="channel.enabled ? 'text-green-600' : 'text-gray-400'">
                    {{ channel.enabled ? '已启用' : '已禁用' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- 登录/登出按钮 -->
              <button 
                v-if="loginRequiredChannels.includes(channel.id) || !getChannelConnectionStatus(channel.id)?.connected"
                @click="loginChannel(channel.id)"
                :disabled="loggingIn === channel.id"
                class="btn-secondary text-sm px-3 py-1.5 inline-flex items-center gap-1"
                title="登录渠道"
              >
                <LogIn class="w-4 h-4" />
                登录
              </button>
              <button 
                v-if="getChannelConnectionStatus(channel.id)?.connected"
                @click="logoutChannel(channel.id)"
                class="btn-secondary text-sm px-3 py-1.5 inline-flex items-center gap-1 text-red-600 hover:bg-red-50"
                title="登出渠道"
              >
                <LogOut class="w-4 h-4" />
                登出
              </button>
              <button
                @click="toggleChannel(channel.id)"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  channel.enabled ? 'bg-primary-600' : 'bg-gray-200'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    channel.enabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
              <button 
                @click="openAddAccount(channel.id)"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="添加账号"
              >
                <Plus class="w-4 h-4 text-gray-500" />
              </button>
              <button 
                @click="deleteChannel(channel.id)"
                class="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="删除渠道"
              >
                <Trash2 class="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        <!-- Accounts Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">账号 ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bot 名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">App ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">绑定 Agent</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(account, accountId) in channel.accounts" :key="accountId" class="hover:bg-gray-50">
                <!-- 编辑模式 -->
                <template v-if="editingAccount?.channelId === channel.id && editingAccount?.accountId === accountId">
                  <td class="px-6 py-4">
                    <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ accountId }}</code>
                  </td>
                  <td class="px-6 py-4">
                    <input v-model="editAccountData.botName" type="text" class="input text-sm" placeholder="Bot 名称" />
                  </td>
                  <td class="px-6 py-4">
                    <input v-model="editAccountData.appId" type="text" class="input text-sm" placeholder="App ID" />
                  </td>
                  <td class="px-6 py-4">
                    <select v-model="editAccountData.agent" class="input text-sm">
                      <option value="">-- 选择 Agent --</option>
                      <option v-for="agent in availableAgents" :key="agent.id" :value="agent.id">
                        {{ agent.name }}
                      </option>
                    </select>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="saveEditAccount" class="p-1 hover:bg-green-100 rounded text-green-600 mr-1">
                      <Check class="w-4 h-4" />
                    </button>
                    <button @click="cancelEditAccount" class="p-1 hover:bg-red-100 rounded text-red-600">
                      <X class="w-4 h-4" />
                    </button>
                  </td>
                </template>
                <!-- 显示模式 -->
                <template v-else>
                  <td class="px-6 py-4">
                    <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ accountId }}</code>
                  </td>
                  <td class="px-6 py-4 font-medium text-gray-900">
                    {{ account.botName }}
                  </td>
                  <td class="px-6 py-4">
                    <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ account.appId }}</code>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {{ account.agent || '-' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      @click="startEditAccount(channel.id, accountId, account)"
                      class="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3"
                    >
                      编辑
                    </button>
                    <button 
                      @click="deleteAccount(channel.id, accountId)"
                      class="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      删除
                    </button>
                  </td>
                </template>
              </tr>
              <tr v-if="Object.keys(channel.accounts || {}).length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  暂无账号，点击上方 + 按钮添加
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Media Roots -->
        <div v-if="channel.mediaLocalRoots?.length" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h4 class="text-sm font-medium text-gray-700 mb-2">媒体文件根目录</h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="root in channel.mediaLocalRoots"
              :key="root"
              class="inline-flex items-center px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm text-gray-600"
            >
              {{ root }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="store.channels.length === 0" class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">暂无渠道配置</h3>
        <p class="text-gray-500">点击上方按钮添加渠道</p>
      </div>
    </div>

    <!-- 添加渠道 Modal -->
    <div v-if="showAddChannelModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">添加渠道</h3>
          <p class="text-sm text-gray-500 mt-1">配置新的消息渠道</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="label">渠道 ID</label>
            <input v-model="newChannel.id" type="text" class="input" placeholder="例如: feishu, telegram, whatsapp" />
            <p class="text-xs text-gray-500 mt-1">支持: feishu, telegram, whatsapp, discord, signal 等</p>
          </div>
          <div>
            <label class="label">DM 策略</label>
            <select v-model="newChannel.dmPolicy" class="input">
              <option v-for="opt in dmPolicyOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">App ID</label>
            <input v-model="newChannel.appId" type="text" class="input" placeholder="应用 ID" />
          </div>
          <div>
            <label class="label">App Secret</label>
            <input v-model="newChannel.appSecret" type="password" class="input" placeholder="应用密钥" />
          </div>
          <div>
            <label class="label">Encrypt Key (可选)</label>
            <input v-model="newChannel.encryptKey" type="text" class="input" placeholder="加密密钥" />
          </div>
          <div>
            <label class="label">Verification Token (可选)</label>
            <input v-model="newChannel.verificationToken" type="text" class="input" placeholder="验证令牌" />
          </div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="newChannel.enabled" type="checkbox" class="w-4 h-4 text-primary-600 border-gray-300 rounded" />
            <span class="text-sm text-gray-700">启用此渠道</span>
          </label>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button @click="showAddChannelModal = false" class="btn-secondary">取消</button>
          <button 
            @click="addChannel" 
            :disabled="!newChannel.id"
            class="btn-primary disabled:opacity-50"
          >
            添加渠道
          </button>
        </div>
      </div>
    </div>

    <!-- 添加账号 Modal -->
    <div v-if="showAddAccountModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">添加账号</h3>
          <p class="text-sm text-gray-500 mt-1">为 {{ currentChannelId }} 添加账号</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="label">账号 ID</label>
            <input v-model="newAccount.id" type="text" class="input" placeholder="例如: main, bot2" />
          </div>
          <div>
            <label class="label">Bot 名称</label>
            <input v-model="newAccount.botName" type="text" class="input" placeholder="显示名称" />
          </div>
          <div>
            <label class="label">App ID</label>
            <input v-model="newAccount.appId" type="text" class="input" placeholder="应用 ID" />
          </div>
          <div>
            <label class="label">App Secret (可选)</label>
            <input v-model="newAccount.appSecret" type="password" class="input" placeholder="应用密钥" />
          </div>
          <div>
            <label class="label">绑定 Agent</label>
            <select v-model="newAccount.agent" class="input">
              <option value="">-- 不绑定 --</option>
              <option v-for="agent in availableAgents" :key="agent.id" :value="agent.id">
                {{ agent.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button @click="showAddAccountModal = false" class="btn-secondary">取消</button>
          <button 
            @click="addAccount" 
            :disabled="!newAccount.id || !newAccount.botName || !newAccount.appId"
            class="btn-primary disabled:opacity-50"
          >
            添加账号
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
