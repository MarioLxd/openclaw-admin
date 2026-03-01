import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 获取定时任务列表
export default defineEventHandler(async () => {
  try {
    const output = execSync('openclaw cron list --json 2>&1', {
      encoding: 'utf-8',
      timeout: 10000,
    })
    
    // 使用正则提取 JSON 对象
    const jsonMatch = output.match(/\{[\s\S]*"jobs"[\s\S]*\}/)
    
    if (!jsonMatch) {
      return { ok: true, result: [] }
    }
    
    const data = JSON.parse(jsonMatch[0])
    const jobs = data.jobs || []
    
    return {
      ok: true,
      result: jobs,
    }
  } catch (error: any) {
    console.error('Error listing cron jobs:', error)
    return {
      ok: false,
      error: error.message || 'Failed to list cron jobs',
    }
  }
})
