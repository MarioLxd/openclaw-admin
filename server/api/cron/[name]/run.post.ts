import { defineEventHandler, getRouterParam } from 'h3'
import { execSync } from 'child_process'

// 辅助函数：从 CLI 输出中提取 JSON
function extractJson(output: string): any {
  const jsonMatch = output.match(/\{[\s\S]*"jobs"[\s\S]*\}/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null
}

// 立即运行定时任务
export default defineEventHandler(async (event) => {
  let jobName = getRouterParam(event, 'name')
  
  // 解码 URL 编码的中文
  if (jobName) {
    jobName = decodeURIComponent(jobName)
  }
  
  if (!jobName) {
    return { ok: false, error: 'Job name is required' }
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
    
    // 使用 job id 运行任务，增加超时时间
    execSync(`openclaw cron run "${jobId}" --timeout 60000 2>&1`, {
      encoding: 'utf-8',
      timeout: 70000,
    })
    
    return {
      ok: true,
      result: { name: jobName, id: jobId, triggered: true },
    }
  } catch (error: any) {
    console.error('Error running cron job:', error)
    return {
      ok: false,
      error: error.message || 'Failed to run cron job',
    }
  }
})
