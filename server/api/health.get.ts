import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// 获取完整的系统健康状态
export default defineEventHandler(async () => {
  try {
    const result: any = {
      gateway: { running: false, port: 18789 },
      config: { loaded: false },
      sessions: { total: 0, active: 0 },
      channels: {} as Record<string, any>,
      version: 'unknown',
    }
    
    // 1. 检查 Gateway 进程状态
    try {
      const pgrepOutput = execSync('pgrep -f "openclaw.*gateway" 2>/dev/null || echo ""').toString().trim()
      result.gateway.running = pgrepOutput.length > 0
    } catch (e) {
      result.gateway.running = false
    }
    
    // 2. 尝试调用 openclaw health --json
    try {
      const healthOutput = execSync('openclaw health --json 2>/dev/null', { 
        encoding: 'utf-8',
        timeout: 10000 
      })
      const healthInfo = JSON.parse(healthOutput)
      result.health = healthInfo
      
      // 从 health 信息中提取渠道状态
      if (healthInfo?.channels) {
        result.channels = healthInfo.channels
      }
    } catch (e) {
      // health 命令可能失败，继续
    }
    
    // 3. 获取 OpenClaw 版本
    try {
      result.version = execSync('openclaw --version 2>/dev/null').toString().trim()
    } catch (e) {
      // 忽略
    }
    
    // 4. 统计会话数
    try {
      const agentsDir = join(homedir(), '.openclaw', 'agents')
      if (existsSync(agentsDir)) {
        const agents = readdirSync(agentsDir, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => d.name)
        
        let totalSessions = 0
        let recentSessions = 0
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        
        for (const agent of agents) {
          const sessionsFile = join(agentsDir, agent, 'sessions', 'sessions.json')
          if (existsSync(sessionsFile)) {
            try {
              const sessionsData = JSON.parse(readFileSync(sessionsFile, 'utf-8'))
              if (Array.isArray(sessionsData)) {
                totalSessions += sessionsData.length
                // 统计24小时内的活跃会话
                recentSessions += sessionsData.filter((s: any) => {
                  const updated = s.updatedAt ? new Date(s.updatedAt).getTime() : 0
                  return updated > oneDayAgo
                }).length
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
        
        result.sessions = {
          total: totalSessions,
          active: recentSessions,
          agents: agents.length,
        }
      }
    } catch (e) {
      // 忽略会话统计错误
    }
    
    // 5. 检查配置文件
    try {
      const configPath = join(homedir(), '.openclaw', 'openclaw.json')
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'))
        result.config.loaded = true
        result.config.lastTouchedAt = config.meta?.lastTouchedAt
        result.config.version = config.meta?.lastTouchedVersion
      }
    } catch (e) {
      // 忽略配置读取错误
    }
    
    return {
      ok: true,
      result,
    }
  } catch (error: any) {
    console.error('Error getting health status:', error)
    return {
      ok: false,
      error: error.message || 'Failed to get health status',
    }
  }
})
