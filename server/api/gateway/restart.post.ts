import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 重启 Gateway（通过 SIGUSR1 信号）
export default defineEventHandler(async (event) => {
  try {
    // 发送 SIGUSR1 信号给 OpenClaw 进程
    execSync('pkill -SIGUSR1 -f "openclaw.*gateway" || true')
    
    return {
      ok: true,
      message: 'Gateway restart signal sent'
    }
  } catch (error: any) {
    console.error('Error restarting gateway:', error)
    return {
      ok: false,
      error: error.message || 'Failed to restart gateway'
    }
  }
})
