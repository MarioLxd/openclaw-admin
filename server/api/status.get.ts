import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 获取 Gateway 状态
export default defineEventHandler(async () => {
  try {
    // 检查 OpenClaw 进程是否在运行
    const isRunning = execSync('pgrep -f "openclaw.*gateway" || echo "not running"').toString().trim() !== 'not running'
    
    return {
      ok: true,
      result: {
        status: isRunning ? 'running' : 'stopped',
        gateway: {
          port: 18789,
          mode: 'local'
        }
      }
    }
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Failed to get status'
    }
  }
})
