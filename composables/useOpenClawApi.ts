import type { OpenClawConfig, ApiResponse } from './useOpenClaw'

export const useOpenClawApi = () => {
  // 使用 Nuxt 代理，避免 CORS 问题
  const baseUrl = '/api/proxy'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // 获取配置（通过 Nuxt Server 直接读取文件）
  const getConfig = async (): Promise<ApiResponse<OpenClawConfig>> => {
    try {
      const data = await $fetch<ApiResponse<OpenClawConfig>>('/api/config')
      return data
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to fetch config',
      }
    }
  }

  // 更新配置（使用 patch）
  const updateConfig = async (patch: Partial<OpenClawConfig>): Promise<ApiResponse<any>> => {
    try {
      const data = await $fetch<ApiResponse<any>>('/api/config', {
        method: 'PATCH',
        body: patch,
      })
      return data
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to update config',
      }
    }
  }

  // 应用完整配置
  const applyConfig = async (configData: OpenClawConfig): Promise<ApiResponse<any>> => {
    try {
      const data = await $fetch<ApiResponse<any>>('/api/config', {
        method: 'POST',
        body: configData,
      })
      return data
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to apply config',
      }
    }
  }

  // 重启 Gateway
  const restartGateway = async (): Promise<ApiResponse<any>> => {
    try {
      const data = await $fetch<ApiResponse<any>>('/api/gateway/restart', {
        method: 'POST',
      })
      return data
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to restart gateway',
      }
    }
  }

  // 获取状态
  const getStatus = async (): Promise<ApiResponse<any>> => {
    try {
      const data = await $fetch<ApiResponse<any>>('/api/status')
      return data
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to fetch status',
      }
    }
  }

  // 获取 Agent 列表
  const getAgents = async (): Promise<ApiResponse<OpenClawConfig['agents']['list']>> => {
    const result = await getConfig()
    if (result.ok && result.result) {
      return {
        ok: true,
        result: result.result.agents.list,
      }
    }
    return {
      ok: false,
      error: result.error,
    }
  }

  // 创建 Agent
  const createAgent = async (agent: OpenClawConfig['agents']['list'][0]): Promise<ApiResponse<any>> => {
    const current = await getConfig()
    if (!current.ok || !current.result) {
      return { ok: false, error: 'Failed to get current config' }
    }
    
    const newConfig = { ...current.result }
    newConfig.agents.list.push(agent)
    
    return updateConfig({ agents: newConfig.agents })
  }

  // 删除 Agent
  const deleteAgent = async (agentId: string): Promise<ApiResponse<any>> => {
    const current = await getConfig()
    if (!current.ok || !current.result) {
      return { ok: false, error: 'Failed to get current config' }
    }
    
    const newConfig = { ...current.result }
    newConfig.agents.list = newConfig.agents.list.filter(a => a.id !== agentId)
    
    return updateConfig({ agents: newConfig.agents })
  }

  return {
    getConfig,
    updateConfig,
    applyConfig,
    restartGateway,
    getStatus,
    getAgents,
    createAgent,
    deleteAgent,
  }
}
