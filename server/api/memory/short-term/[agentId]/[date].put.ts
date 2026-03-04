import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
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
    const body = await readBody(event)
    const content = body?.content ?? ''

    const config = readConfig()
    const agent = (config?.agents?.list || []).find((a: any) => a.id === agentId)
    if (!agent) return { ok: false, error: 'Agent not found' }

    const workspace = (agent.workspace || '').replace('~', homedir())
    const memDir = join(workspace, 'memory')
    if (!existsSync(memDir)) mkdirSync(memDir, { recursive: true })

    const filePath = join(memDir, `${date}.md`)
    writeFileSync(filePath, content, 'utf-8')

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to save memory file' }
  }
})
