import { defineEventHandler, getRouterParam } from 'h3'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Agent 内核文件列表
const KERNEL_FILES = [
  { name: 'SOUL.md', description: '核心人格定义', required: true },
  { name: 'AGENTS.md', description: 'Agent 行为规范', required: true },
  { name: 'IDENTITY.md', description: '身份标识', required: true },
  { name: 'USER.md', description: '用户信息', required: false },
  { name: 'TOOLS.md', description: '工具配置', required: false },
  { name: 'HEARTBEAT.md', description: '心跳任务', required: false },
]

interface KernelFile {
  name: string
  description: string
  required: boolean
  content: string
  exists: boolean
}

// 获取 agent 的工作目录
function getAgentWorkspace(agentId: string, config: any): string | null {
  const agent = config?.agents?.list?.find((a: any) => a.id === agentId)
  if (agent?.workspace) {
    // 解析 ~ 路径
    if (agent.workspace.startsWith('~/')) {
      return join(homedir(), agent.workspace.slice(2))
    }
    return agent.workspace
  }
  return null
}

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'id')
    
    if (!agentId) {
      return { ok: false, error: 'Agent ID is required' }
    }

    // 读取 OpenClaw 配置获取工作目录
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    let config: any = null
    
    try {
      if (existsSync(configPath)) {
        config = JSON.parse(readFileSync(configPath, 'utf-8'))
      }
    } catch (e) {
      // 忽略配置读取错误
    }

    const workspace = getAgentWorkspace(agentId, config)
    
    if (!workspace) {
      return { ok: false, error: `Agent "${agentId}" workspace not found` }
    }

    // 读取所有内核文件
    const kernels: KernelFile[] = KERNEL_FILES.map(file => {
      const filePath = join(workspace, file.name)
      const fileExists = existsSync(filePath)
      
      let content = ''
      if (fileExists) {
        try {
          content = readFileSync(filePath, 'utf-8')
        } catch (e) {
          content = ''
        }
      }
      
      return {
        name: file.name,
        description: file.description,
        required: file.required,
        exists: fileExists,
        content,
      }
    })

    return {
      ok: true,
      result: {
        agentId,
        workspace,
        kernels,
      },
    }
  } catch (error: any) {
    console.error('Error getting agent kernels:', error)
    return { ok: false, error: error.message || 'Failed to get agent kernels' }
  }
})
