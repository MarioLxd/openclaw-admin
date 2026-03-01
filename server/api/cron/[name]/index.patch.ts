import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { execSync } from 'child_process'

// 辅助函数：从 CLI 输出中提取 JSON
function extractJson(output: string): any {
  const jsonMatch = output.match(/\{[\s\S]*"jobs"[\s\S]*\}/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null
}

// 更新定时任务状态（启用/禁用）
export default defineEventHandler(async (event) => {
  let jobName = getRouterParam(event, 'name')
  const body = await readBody(event)
  const { enabled } = body
  
  // 解码 URL 编码的中文
  if (jobName) {
    jobName = decodeURIComponent(jobName)
  }
  
  if (!jobName) {
    return { ok: false, error: 'Job name is required' }
  }
  
  if (enabled === undefined) {
    return { ok: false, error: 'enabled field is required' }
  }
  
  try {
    // 首先获取 job 列表找到对应的 id
    const listOutput = execSync('openclaw cron list --json 2>&1', {
      encoding: 'utf-8',
      timeout: 10000,
    })
    
    const data = extractJson(listOutput)
    const jobs = data?.jobs || []
    const job = jobs.find((j: any) => j.name === jobName)
    
    if (!job) {
      return { ok: false, error: `Job "${jobName}" not found` }
    }
    
    const jobId = job.id
    const action = enabled ? 'enable' : 'disable'
    
    execSync(`openclaw cron ${action} "${jobId}" 2>&1`, {
      encoding: 'utf-8',
      timeout: 10000,
    })
    
    return {
      ok: true,
      result: { name: jobName, id: jobId, enabled },
    }
  } catch (error: any) {
    console.error('Error updating cron job:', error)
    return {
      ok: false,
      error: error.message || 'Failed to update cron job',
    }
  }
})
