import { defineEventHandler, getQuery } from 'h3'
import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// 获取渠道连接状态
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const channel = query.channel as string
    
    // 获取 openclaw health 信息
    let healthInfo: any = null
    try {
      const healthOutput = execSync('openclaw health --json 2>/dev/null', { 
        encoding: 'utf-8',
        timeout: 10000 
      })
      healthInfo = JSON.parse(healthOutput)
    } catch (e) {
      // health 命令可能失败，继续使用其他方式检查
    }
    
    // 检查凭据目录
    const credentialsDir = join(homedir(), '.openclaw', 'credentials')
    const channelCredentials: Record<string, any> = {}
    
    if (existsSync(credentialsDir)) {
      const items = readdirSync(credentialsDir)
      for (const item of items) {
        if (item.startsWith('.')) continue
        const itemPath = join(credentialsDir, item)
        const stats = statSync(itemPath)
        
        // 解析凭据名称格式: provider_account
        const [provider, account] = item.split('_')
        if (!channel || provider === channel) {
          if (!channelCredentials[provider]) {
            channelCredentials[provider] = {}
          }
          channelCredentials[provider][account || 'default'] = {
            exists: true,
            lastModified: stats.mtime,
          }
        }
      }
    }
    
    // 组合结果
    const result: Record<string, any> = {}
    
    for (const [provider, accounts] of Object.entries(channelCredentials)) {
      result[provider] = {
        accounts,
        hasCredentials: Object.keys(accounts).length > 0,
      }
      
      // 如果有 health 信息，添加连接状态
      if (healthInfo?.channels?.[provider]) {
        result[provider].connectionStatus = healthInfo.channels[provider]
      }
    }
    
    return {
      ok: true,
      result,
    }
  } catch (error: any) {
    console.error('Error getting channel status:', error)
    return {
      ok: false,
      error: error.message || 'Failed to get channel status',
    }
  }
})
