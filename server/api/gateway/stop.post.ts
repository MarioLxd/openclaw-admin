import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 停止 Gateway
export default defineEventHandler(async () => {
  try {
    // 发送 SIGTERM 信号给 Gateway 进程
    execSync('pkill -f "openclaw.*gateway" 2>/dev/null || true')
    
    return {
      ok: true,
      message: 'Gateway stopped',
    }
  } catch (error: any) {
    console.error('Error stopping gateway:', error)
    return {
      ok: false,
      error: error.message || 'Failed to stop gateway',
    }
  }
})
