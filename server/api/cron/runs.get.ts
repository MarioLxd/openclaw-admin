import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import { execSync } from 'child_process'

// 辅助函数：从 CLI 输出中提取 JSON
function extractJson(output: string): any {
  const jsonMatch = output.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null
}

// 获取定时任务运行历史
export default defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, 'name')
    const query = getQuery(event)
    const limit = query.limit || 20
    
    let cmd = `openclaw cron runs --json --limit ${limit} 2>&1`
    if (name) {
      cmd = `openclaw cron runs "${name}" --json --limit ${limit} 2>&1`
    }
    
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 10000,
    })
    
    const data = extractJson(output)
    const runs = Array.isArray(data) ? data : (data?.runs || [])
    
    return {
      ok: true,
      result: runs,
    }
  } catch (error: any) {
    console.error('Error getting cron runs:', error)
    return {
      ok: false,
      error: error.message || 'Failed to get cron runs',
    }
  }
})
