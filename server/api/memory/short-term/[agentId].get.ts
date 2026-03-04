import { defineEventHandler, getRouterParam } from 'h3'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
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
    const config = readConfig()
    const agents: any[] = config?.agents?.list || []
    const agent = agents.find((a: any) => a.id === agentId)

    if (!agent) {
      return { ok: false, error: 'Agent not found' }
    }

    const workspace = (agent.workspace || '').replace('~', homedir())
    const shortTermDir = join(workspace, 'memory')

    if (!existsSync(shortTermDir)) {
      return { ok: true, result: [] }
    }

    const files = readdirSync(shortTermDir)
      .filter((f: string) => f.endsWith('.md'))
      .map((f: string) => {
        const filePath = join(shortTermDir, f)
        const stat = statSync(filePath)
        const date = f.replace('.md', '')
        return {
          date,
          filename: f,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
        }
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date))

    return { ok: true, result: files }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to list short-term memory' }
  }
})
