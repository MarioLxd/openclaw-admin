import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

function readConfig() {
  const configPath = join(homedir(), '.openclaw', 'openclaw.json')
  return JSON.parse(readFileSync(configPath, 'utf-8'))
}

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'agentId')
    const body = await readBody(event)
    const content = body?.content ?? ''

    const config = readConfig()
    const agent = (config?.agents?.list || []).find((a: any) => a.id === agentId)
    if (!agent) return { ok: false, error: 'Agent not found' }

    const workspace = (agent.workspace || '').replace('~', homedir())
    writeFileSync(join(workspace, 'MEMORY.md'), content, 'utf-8')

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
})
