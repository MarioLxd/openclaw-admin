import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 获取 cron 调度器状态
export default defineEventHandler(async () => {
  try {
    const output = execSync('openclaw cron status --json 2>&1', {
      encoding: 'utf-8',
      timeout: 10000,
    })
    
    // 使用正则提取 JSON 对象
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return { ok: true, result: null }
    }
    
    const status = JSON.parse(jsonMatch[0])
    
    return {
      ok: true,
      result: status,
    }
  } catch (error: any) {
    console.error('Error getting cron status:', error)
    return {
      ok: false,
      error: error.message || 'Failed to get cron status',
    }
  }
})
