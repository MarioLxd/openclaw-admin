import { defineEventHandler } from 'h3'
import { spawn } from 'child_process'

// 启动 Gateway
export default defineEventHandler(async () => {
  try {
    // 检查是否已经在运行
    const { execSync } = await import('child_process')
    const pgrepOutput = execSync('pgrep -f "openclaw.*gateway" 2>/dev/null || echo ""').toString().trim()
    
    if (pgrepOutput.length > 0) {
      return {
        ok: false,
        error: 'Gateway is already running',
      }
    }
    
    // 启动 Gateway（后台运行）
    const child = spawn('openclaw', ['gateway'], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    
    return {
      ok: true,
      message: 'Gateway started',
    }
  } catch (error: any) {
    console.error('Error starting gateway:', error)
    return {
      ok: false,
      error: error.message || 'Failed to start gateway',
    }
  }
})
