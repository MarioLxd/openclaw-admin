import { defineEventHandler, readBody } from 'h3'
import { execSync } from 'child_process'

// 辅助函数：从 CLI 输出中提取 JSON
function extractJson(output: string): any {
  const jsonMatch = output.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null
}

// 判断是否是 cron 表达式（包含空格）
function isCronExpression(value: string): boolean {
  return value.includes(' ') || /^\*|\d/.test(value) && value.split(' ').length >= 5
}

// 处理 duration 格式（去掉前导 + 号）
function normalizeDuration(value: string): string {
  if (value.startsWith('+')) {
    return value.slice(1)
  }
  return value
}

// 添加定时任务
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      name,
      cron,
      every,
      at,
      message,
      agent,
      to,
      channel,
      description,
      disabled,
      timezone,
      timeout,
    } = body
    
    if (!name) {
      return { ok: false, error: 'Job name is required' }
    }
    
    if (!cron && !every && !at) {
      return { ok: false, error: 'One of cron, every, or at is required' }
    }
    
    if (!message && !agent) {
      return { ok: false, error: 'Message or agent is required' }
    }
    
    // 构建命令参数
    const args: string[] = []
    
    args.push('--name', `"${name.replace(/"/g, '\\"')}"`)
    
    // 智能判断 cron 还是 every
    if (cron) {
      args.push('--cron', `"${cron}"`)
    } else if (every) {
      // 如果 every 值看起来像 cron 表达式（包含空格），则使用 --cron
      if (isCronExpression(every)) {
        args.push('--cron', `"${every}"`)
      } else {
        args.push('--every', `"${normalizeDuration(every)}"`)
      }
    }
    if (at) {
      // --at 格式：去掉前导 + 号，支持 1m, 20m, 1h 等格式
      args.push('--at', `"${normalizeDuration(at)}"`)
    }
    if (message) args.push('--message', `"${message.replace(/"/g, '\\"')}"`)
    if (agent) args.push('--agent', agent)
    if (to) args.push('--to', to)
    if (channel) args.push('--channel', channel)
    if (description) args.push('--description', `"${description.replace(/"/g, '\\"')}"`)
    if (disabled) args.push('--disabled')
    if (timezone) args.push('--tz', timezone)
    if (timeout) args.push('--timeout', String(timeout))
    
    const cmd = `openclaw cron add --json ${args.join(' ')} 2>&1`
    console.log('Executing:', cmd)
    
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 15000,
    })
    
    const job = extractJson(output)
    
    return {
      ok: true,
      result: job,
    }
  } catch (error: any) {
    console.error('Error adding cron job:', error)
    return {
      ok: false,
      error: error.message || 'Failed to add cron job',
    }
  }
})
