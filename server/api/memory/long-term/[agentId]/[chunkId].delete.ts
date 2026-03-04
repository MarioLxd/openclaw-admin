import { defineEventHandler, getRouterParam } from 'h3'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'agentId')
    const chunkId = getRouterParam(event, 'chunkId')

    // Validate to prevent injection
    if (!/^[\w-]+$/.test(agentId || '')) return { ok: false, error: 'Invalid agent ID' }
    if (!chunkId) return { ok: false, error: 'Missing chunk ID' }

    const sqlitePath = join(homedir(), '.openclaw', 'memory', `${agentId}.sqlite`)
    if (!existsSync(sqlitePath)) return { ok: false, error: 'Memory database not found' }

    const escaped = chunkId.replace(/'/g, "''")
    // Delete from FTS index and main table
    execSync(`sqlite3 "${sqlitePath}" "DELETE FROM chunks_fts WHERE id='${escaped}'; DELETE FROM chunks WHERE id='${escaped}';"`, { encoding: 'utf-8' })

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to delete chunk' }
  }
})
