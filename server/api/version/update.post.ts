import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 更新 OpenClaw 到最新版本
export default defineEventHandler(async () => {
  try {
    // 执行 npm 更新
    const output = execSync('npm install -g openclaw', { 
      encoding: 'utf-8',
      timeout: 120000, // 2分钟超时
    })
    
    // 获取更新后的版本
    let newVersion = 'unknown'
    try {
      newVersion = execSync('openclaw --version 2>/dev/null').toString().trim()
    } catch (e) {
      // 忽略
    }
    
    return {
      ok: true,
      result: {
        output,
        newVersion,
      },
    }
  } catch (error: any) {
    console.error('Error updating OpenClaw:', error)
    return {
      ok: false,
      error: error.message || 'Failed to update OpenClaw',
    }
  }
})
