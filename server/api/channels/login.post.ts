import { defineEventHandler, readBody } from 'h3'
import { spawn } from 'child_process'

// 渠道登录
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { channel, accountId } = body
    
    if (!channel) {
      return {
        ok: false,
        error: 'Channel is required',
      }
    }
    
    // 构建 openclaw channels login 命令
    const args = ['channels', 'login']
    if (accountId) {
      args.push('--account', accountId)
    }
    args.push('--provider', channel)
    
    // 执行命令（异步，因为可能需要用户交互）
    const child = spawn('openclaw', args, {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    
    return {
      ok: true,
      message: `Login command started for ${channel}${accountId ? `:${accountId}` : ''}`,
    }
  } catch (error: any) {
    console.error('Error starting channel login:', error)
    return {
      ok: false,
      error: error.message || 'Failed to start login',
    }
  }
})
