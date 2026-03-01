// OpenClaw 配置状态管理
import type { OpenClawConfig } from './useOpenClaw'

// API Key 凭据类型
export interface Credential {
  name: string
  provider: string
  profile: string
  hasKey: boolean
  source?: 'env' | 'auth' | 'credentials'
}

export const useOpenClawStore = defineStore('openclaw', () => {
  const config = ref<OpenClawConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // API Key 凭据列表
  const credentials = ref<Credential[]>([])

  const api = useOpenClawApi()

  // 加载配置
  const loadConfig = async () => {
    loading.value = true
    error.value = null
    
    const result = await api.getConfig()
    if (result.ok && result.result) {
      config.value = result.result
    } else {
      error.value = result.error || 'Unknown error'
    }
    
    loading.value = false
    return result.ok
  }

  // 保存配置片段
  const saveConfigPatch = async (patch: Partial<OpenClawConfig>) => {
    loading.value = true
    
    const result = await api.updateConfig(patch)
    if (result.ok) {
      // 重新加载以获取最新配置
      await loadConfig()
    } else {
      error.value = result.error || 'Failed to save config'
    }
    
    loading.value = false
    return result.ok
  }

  // ==================== API Key 管理 ====================
  
  // 加载凭据列表
  const loadCredentials = async () => {
    try {
      const response = await $fetch<{ ok: boolean; result?: Credential[]; error?: string }>('/api/credentials')
      if (response.ok && response.result) {
        credentials.value = response.result
      }
      return response.ok
    } catch (e) {
      return false
    }
  }

  // 检查某个 provider 是否已配置 API Key
  const hasCredential = (providerId: string) => {
    // 1. 检查 credentials 目录中的凭据
    if (credentials.value.some(c => c.provider === providerId)) {
      return true
    }
    
    // 2. 检查 env 中的 API Key（格式：{PROVIDER}_API_KEY）
    const envKey = `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`
    if (config.value?.env?.[envKey]) {
      return true
    }
    
    // 3. 检查 auth.profiles 中的配置
    const profileKey = `${providerId}:default`
    if (config.value?.auth?.profiles?.[profileKey]) {
      return true
    }
    
    return false
  }

  // 获取某个 provider 的凭据信息
  const getCredential = (providerId: string) => {
    // 先从 credentials 目录查找
    const cred = credentials.value.find(c => c.provider === providerId)
    if (cred) return cred
    
    // 检查 env 中的 API Key
    const envKey = `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`
    if (config.value?.env?.[envKey]) {
      return {
        name: envKey,
        provider: providerId,
        profile: 'default',
        hasKey: true,
        source: 'env',
      }
    }
    
    // 检查 auth.profiles
    const profileKey = `${providerId}:default`
    if (config.value?.auth?.profiles?.[profileKey]) {
      return {
        name: profileKey,
        provider: providerId,
        profile: 'default',
        hasKey: true,
        source: 'auth',
      }
    }
    
    return undefined
  }

  // 保存 API Key
  const saveCredential = async (provider: string, apiKey: string, profile = 'default') => {
    try {
      const response = await $fetch<{ ok: boolean; error?: string }>('/api/credentials', {
        method: 'POST',
        body: { provider, profile, apiKey },
      })
      if (response.ok) {
        await loadCredentials()
      }
      return response.ok
    } catch (e) {
      return false
    }
  }

  // 删除 API Key
  const deleteCredential = async (name: string) => {
    try {
      const response = await $fetch<{ ok: boolean; error?: string }>(`/api/credentials/${name}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadCredentials()
      }
      return response.ok
    } catch (e) {
      return false
    }
  }

  // Agents 计算属性
  const agents = computed(() => config.value?.agents.list || [])
  
  // 模型提供商计算属性（带 API Key 状态）
  const modelProviders = computed(() => {
    if (!config.value?.models.providers) return []
    return Object.entries(config.value.models.providers).map(([id, provider]) => ({
      id,
      ...provider,
      hasApiKey: hasCredential(id),
    }))
  })

  // 渠道计算属性
  const channels = computed(() => {
    if (!config.value?.channels) return []
    return Object.entries(config.value.channels).map(([id, channel]) => ({
      id,
      ...channel,
    }))
  })

  // 绑定关系计算属性
  const bindings = computed(() => config.value?.bindings || [])

  // Gateway 配置计算属性
  const gatewayConfig = computed(() => config.value?.gateway)

  // Skills 配置计算属性
  const skillsConfig = computed(() => config.value?.skills)

  return {
    config,
    loading,
    error,
    agents,
    modelProviders,
    channels,
    bindings,
    gatewayConfig,
    skillsConfig,
    credentials,
    loadConfig,
    saveConfigPatch,
    loadCredentials,
    hasCredential,
    getCredential,
    saveCredential,
    deleteCredential,
  }
})
