import { defineEventHandler, readBody } from 'h3'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'

// 创建 Agent（包括创建工作目录）
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id, name, workspace, model, identity, isDefault } = body
    
    if (!id || !name || !workspace) {
      return {
        ok: false,
        error: 'Agent ID, name and workspace are required',
      }
    }
    
    // 1. 创建工作目录
    const workspacePath = workspace.replace('~', homedir())
    if (!existsSync(workspacePath)) {
      try {
        mkdirSync(workspacePath, { recursive: true })
        
        // 创建必要的子目录
        mkdirSync(join(workspacePath, 'memory'), { recursive: true })
        mkdirSync(join(workspacePath, 'sessions'), { recursive: true })
        
        // 创建基本的 AGENTS.md 文件
        const agentsContent = `# AGENTS.md - ${name}

This is the workspace for ${name} (${id}).

## Identity

- Name: ${identity?.name || name}
- Theme: ${identity?.theme || 'helpful assistant'}
- Emoji: ${identity?.emoji || '🤖'}

## Model

- Primary: ${model?.primary || 'default'}
`
        writeFileSync(join(workspacePath, 'AGENTS.md'), agentsContent)
        
        // 创建空的 MEMORY.md
        writeFileSync(join(workspacePath, 'MEMORY.md'), '# MEMORY.md\n\nPersonal memories and context.\n')
        
        // 创建空的 USER.md
        const userContent = `# USER.md - About Your Human

_Learn about the person you're helping._

- **Name:**
- **Timezone:**
- **Notes:**

---
The more you know, the better you can help.
`
        writeFileSync(join(workspacePath, 'USER.md'), userContent)
        
      } catch (e: any) {
        return {
          ok: false,
          error: `Failed to create workspace: ${e.message}`,
        }
      }
    }
    
    // 2. 读取当前配置
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    let config: any = {}
    
    try {
      const configData = execSync(`cat "${configPath}"`, { encoding: 'utf-8' })
      // 使用 JSON5 解析（如果可用）或普通 JSON
      try {
        config = JSON.parse(configData.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'))
      } catch {
        config = JSON.parse(configData)
      }
    } catch (e) {
      return {
        ok: false,
        error: 'Failed to read config file',
      }
    }
    
    // 3. 添加 Agent 到配置
    if (!config.agents) {
      config.agents = { list: [] }
    }
    if (!config.agents.list) {
      config.agents.list = []
    }
    
    // 检查 ID 是否已存在
    if (config.agents.list.some((a: any) => a.id === id)) {
      return {
        ok: false,
        error: `Agent with ID "${id}" already exists`,
      }
    }
    
    // 如果设为默认，取消其他 Agent 的默认标记
    if (isDefault) {
      config.agents.list.forEach((a: any) => {
        a.default = false
      })
    }
    
    // 添加新 Agent
    config.agents.list.push({
      id,
      name,
      workspace,
      model: { primary: model?.primary || model },
      identity: {
        name: identity?.name || name,
        theme: identity?.theme || '',
        emoji: identity?.emoji || '🤖',
      },
      default: isDefault || false,
    })
    
    // 更新元数据
    if (!config.meta) {
      config.meta = {}
    }
    config.meta.lastTouchedAt = new Date().toISOString()
    
    // 4. 保存配置
    try {
      writeFileSync(configPath, JSON.stringify(config, null, 2))
    } catch (e: any) {
      return {
        ok: false,
        error: `Failed to save config: ${e.message}`,
      }
    }
    
    return {
      ok: true,
      result: { id, workspace: workspacePath },
    }
  } catch (error: any) {
    console.error('Error creating agent:', error)
    return {
      ok: false,
      error: error.message || 'Failed to create agent',
    }
  }
})
