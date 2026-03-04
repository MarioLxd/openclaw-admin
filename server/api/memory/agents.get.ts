import { defineEventHandler } from 'h3'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'

function readConfig() {
  const configPath = join(homedir(), '.openclaw', 'openclaw.json')
  const raw = readFileSync(configPath, 'utf-8')
  return JSON.parse(raw)
}

export default defineEventHandler(async () => {
  try {
    const config = readConfig()
    const agents: any[] = config?.agents?.list || []
    const memoryDir = join(homedir(), '.openclaw', 'memory')

    const result = agents.map((agent: any) => {
      const workspace = (agent.workspace || '').replace('~', homedir())
      const shortTermDir = join(workspace, 'memory')
      const sqlitePath = join(memoryDir, `${agent.id}.sqlite`)

      // Count short-term files
      let shortTermFiles: string[] = []
      if (existsSync(shortTermDir)) {
        shortTermFiles = readdirSync(shortTermDir)
          .filter((f: string) => f.endsWith('.md'))
          .sort()
          .reverse()
      }

      // Count long-term chunks
      let longTermCount = 0
      let longTermExists = false
      if (existsSync(sqlitePath)) {
        longTermExists = true
        try {
          const out = execSync(`sqlite3 "${sqlitePath}" "SELECT count(*) FROM chunks;"`, { encoding: 'utf-8' }).trim()
          longTermCount = parseInt(out) || 0
        } catch {}
      }

      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.identity?.emoji || '🤖',
        identityName: agent.identity?.name || agent.name,
        workspace: agent.workspace,
        shortTermCount: shortTermFiles.length,
        shortTermDates: shortTermFiles.map((f: string) => f.replace('.md', '')),
        longTermCount,
        longTermExists,
        sqlitePath,
      }
    })

    return { ok: true, result }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to load memory agents' }
  }
})
