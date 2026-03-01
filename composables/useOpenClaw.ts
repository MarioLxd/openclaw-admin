// OpenClaw Gateway API 配置
export const GATEWAY_CONFIG = {
  baseUrl: process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789',
  token: process.env.OPENCLAW_GATEWAY_TOKEN || '',
}

// API 响应类型
export interface ApiResponse<T> {
  ok: boolean
  result?: T
  error?: string
}

// OpenClaw 配置类型
export interface OpenClawConfig {
  meta: {
    lastTouchedVersion: string
    lastTouchedAt: string
  }
  wizard: {
    lastRunAt: string
    lastRunVersion: string
    lastRunCommand: string
    lastRunMode: string
  }
  auth: {
    profiles: Record<string, {
      provider: string
      mode: string
    }>
  }
  models: {
    mode: string
    providers: Record<string, {
      baseUrl: string
      api: string
      models: Array<{
        id: string
        name: string
        reasoning: boolean
        contextWindow: number
        maxTokens: number
        [key: string]: any
      }>
    }>
  }
  agents: {
    defaults: {
      model: {
        primary: string
        fallbacks: string[]
      }
      workspace: string
      maxConcurrent: number
      subagents: {
        maxConcurrent: number
      }
    }
    list: Array<{
      id: string
      name: string
      default?: boolean
      workspace: string
      model: {
        primary: string
      }
      identity: {
        name: string
        theme: string
        emoji: string
      }
    }>
  }
  bindings: Array<{
    agentId: string
    match: {
      channel: string
      accountId: string
    }
  }>
  channels: Record<string, {
    enabled: boolean
    dmPolicy: string
    capabilities: string
    accounts: Record<string, {
      appId: string
      appSecret?: string
      botName: string
      agent?: string
    }>
    mediaLocalRoots: string[]
  }>
  gateway: {
    port: number
    mode: string
    bind: string
    auth: {
      mode: string
      token?: string
    }
    tailscale: {
      mode: string
      resetOnExit: boolean
    }
    nodes: {
      denyCommands: string[]
    }
  }
  skills: {
    load: {
      extraDirs: string[]
    }
  }
  messages: {
    ackReactionScope: string
  }
  commands: {
    native: string
    nativeSkills: string
  }
  plugins: {
    entries: Record<string, {
      enabled: boolean
    }>
  }
}
