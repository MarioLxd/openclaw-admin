import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'

export default defineEventHandler(async (event) => {
  try {
    const agentId = getRouterParam(event, 'agentId')
    const query = getQuery(event)
    const search = (query.search as string) || ''
    const limit = parseInt((query.limit as string) || '50')
    const offset = parseInt((query.offset as string) || '0')

    // Validate agentId to prevent injection (only allow alphanumeric, dash, underscore)
    if (!/^[\w-]+$/.test(agentId || '')) {
      return { ok: false, error: 'Invalid agent ID' }
    }

    const sqlitePath = join(homedir(), '.openclaw', 'memory', `${agentId}.sqlite`)

    if (!existsSync(sqlitePath)) {
      return { ok: true, result: { chunks: [], total: 0 } }
    }

    let countSql: string
    let dataSql: string

    if (search) {
      const escaped = search.replace(/'/g, "''")
      countSql = `SELECT count(*) FROM chunks WHERE text LIKE '%${escaped}%';`
      dataSql = `SELECT id, path, source, start_line, end_line, substr(text, 1, 500) as text, updated_at FROM chunks WHERE text LIKE '%${escaped}%' ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset};`
    } else {
      countSql = `SELECT count(*) FROM chunks;`
      dataSql = `SELECT id, path, source, start_line, end_line, substr(text, 1, 500) as text, updated_at FROM chunks ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset};`
    }

    const totalStr = execSync(`sqlite3 "${sqlitePath}" "${countSql}"`, { encoding: 'utf-8' }).trim()
    const total = parseInt(totalStr) || 0

    const jsonOut = execSync(`sqlite3 -json "${sqlitePath}" "${dataSql}"`, { encoding: 'utf-8' }).trim()
    const chunks = jsonOut ? JSON.parse(jsonOut) : []

    return { ok: true, result: { chunks, total } }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to load long-term memory' }
  }
})
