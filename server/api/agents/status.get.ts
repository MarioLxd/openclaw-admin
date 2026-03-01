import { defineEventHandler, getQuery } from 'h3'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// 获取 Agent 状态（工作目录、会话数等）
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const agentId = query.id as string
    
    const agentsDir = join(homedir(), '.openclaw', 'agents')
    const result: Record<string, any> = {}
    
    // 读取配置中的 agents
    const { readFileSync } = await import('fs')
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    
    let config: any = {}
    try {
      const configData = readFileSync(configPath, 'utf-8')
      config = JSON.parse(configData.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'))
    } catch (e) {
      // 忽略
    }
    
    const agents = config?.agents?.list || []
    
    for (const agent of agents) {
      if (agentId && agent.id !== agentId) continue
      
      const workspacePath = agent.workspace?.replace('~', homedir()) || ''
      const status: any = {
        id: agent.id,
        workspace: agent.workspace,
        workspaceExists: existsSync(workspacePath),
        sessionsCount: 0,
        lastActivity: null,
      }
      
      // 检查工作目录内容
      if (status.workspaceExists) {
        try {
          const sessionsFile = join(workspacePath, 'sessions', 'sessions.json')
          if (existsSync(sessionsFile)) {
            const sessionsData = JSON.parse(readFileSync(sessionsFile, 'utf-8'))
            if (Array.isArray(sessionsData)) {
              status.sessionsCount = sessionsData.length
              // 获取最近活动时间
              const lastSession = sessionsData[sessionsData.length - 1]
              if (lastSession?.updatedAt) {
                status.lastActivity = lastSession.updatedAt
              }
            }
          }
          
          // 检查是否有 memory 文件
          const memoryFile = join(workspacePath, 'MEMORY.md')
          status.hasMemory = existsSync(memoryFile)
          
          // 检查 AGENTS.md
          const agentsFile = join(workspacePath, 'AGENTS.md')
          status.hasAgentsFile = existsSync(agentsFile)
          
        } catch (e) {
          // 忽略错误
        }
      }
      
      result[agent.id] = status
    }
    
    return {
      ok: true,
      result: agentId ? result[agentId] : result,
    }
  } catch (error: any) {
    console.error('Error getting agent status:', error)
    return {
      ok: false,
      error: error.message || 'Failed to get agent status',
    }
  }
})
