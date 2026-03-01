import { defineEventHandler, readBody } from 'h3'
import { execSync } from 'child_process'

// 渠道登出
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
    
    // 构建 openclaw channels logout 命令
    let cmd = `openclaw channels logout --provider ${channel}`
    if (accountId) {
      cmd += ` --account ${accountId}`
    }
    
    execSync(cmd, { encoding: 'utf-8', timeout: 30000 })
    
    return {
      ok: true,
      message: `Logged out from ${channel}${accountId ? `:${accountId}` : ''}`,
    }
  } catch (error: any) {
    console.error('Error logging out channel:', error)
    return {
      ok: false,
      error: error.message || 'Failed to logout',
    }
  }
})
