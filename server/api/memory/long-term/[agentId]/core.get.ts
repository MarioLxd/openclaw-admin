import { defineEventHandler, getRouterParam } from 'h3'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

function readConfig() {
  const configPath = join(homedir(), '.openclaw', 'openclaw.json')
  return JSON.parse(readFileSync(configPath, 'utf-8'))
}

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'agentId')
    const config = readConfig()
    const agent = (config?.agents?.list || []).find((a: any) => a.id === agentId)
    if (!agent) return { ok: false, error: 'Agent not found' }

    const workspace = (agent.workspace || '').replace('~', homedir())
    const filePath = join(workspace, 'MEMORY.md')

    const content = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : ''
    return { ok: true, result: { content, exists: existsSync(filePath) } }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
})
