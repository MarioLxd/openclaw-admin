import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// 获取 agent 的工作目录
function getAgentWorkspace(agentId: string, config: any): string | null {
  const agent = config?.agents?.list?.find((a: any) => a.id === agentId)
  if (agent?.workspace) {
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
    const body = await readBody(event)
    const { kernels } = body
    
    if (!agentId) {
      return { ok: false, error: 'Agent ID is required' }
    }
    
    if (!kernels || !Array.isArray(kernels)) {
      return { ok: false, error: 'kernels array is required' }
    }

    // 读取配置获取工作目录
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    let config: any = null
    
    try {
      if (existsSync(configPath)) {
        config = JSON.parse(readFileSync(configPath, 'utf-8'))
      }
    } catch (e) {
      // ignore
    }

    const workspace = getAgentWorkspace(agentId, config)
    
    if (!workspace) {
      return { ok: false, error: `Agent "${agentId}" workspace not found` }
    }

    // 确保工作目录存在
    if (!existsSync(workspace)) {
      mkdirSync(workspace, { recursive: true })
    }

    // 写入每个内核文件
    const results: Record<string, { success: boolean; error?: string }> = {}
    
    for (const kernel of kernels) {
      const { name, content } = kernel
      const filePath = join(workspace, name)
      
      try {
        // 如果内容为空且是可选文件，则删除文件
        if (!content.trim() && name !== 'SOUL.md' && name !== 'AGENTS.md' && name !== 'IDENTITY.md') {
          if (existsSync(filePath)) {
            writeFileSync(filePath, '', { encoding: 'utf-8' })
          }
        } else {
          writeFileSync(filePath, content, { encoding: 'utf-8' })
        }
        results[name] = { success: true }
      } catch (e: any) {
        results[name] = { success: false, error: e.message }
      }
    }

    // 检查是否有失败
    const failed = Object.entries(results).filter(([, r]) => !r.success)
    if (failed.length > 0) {
      return {
        ok: false,
        error: `Failed to save some files: ${failed.map(([k, v]) => `${k}: ${v.error}`).join(', ')}`,
      }
    }

    return {
      ok: true,
      result: {
        message: 'Kernels saved successfully',
        workspace,
      },
    }
  } catch (error: any) {
    console.error('Error saving agent kernels:', error)
    return { ok: false, error: error.message || 'Failed to save agent kernels' }
  }
})
