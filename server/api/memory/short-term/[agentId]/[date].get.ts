import { defineEventHandler, getRouterParam } from 'h3'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

function readConfig() {
  const configPath = join(homedir(), '.openclaw', 'openclaw.json')
  const raw = readFileSync(configPath, 'utf-8')
  return JSON.parse(raw)
}

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'agentId')
    const date = getRouterParam(event, 'date')
    const config = readConfig()
    const agent = (config?.agents?.list || []).find((a: any) => a.id === agentId)

    if (!agent) return { ok: false, error: 'Agent not found' }

    const workspace = (agent.workspace || '').replace('~', homedir())
    const filePath = join(workspace, 'memory', `${date}.md`)

    if (!existsSync(filePath)) return { ok: false, error: 'File not found' }

    const content = readFileSync(filePath, 'utf-8')
    return { ok: true, result: { date, content } }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to read memory file' }
  }
})
