import { defineEventHandler, readBody } from 'h3'
import { execSync } from 'child_process'
import { homedir } from 'os'

// 打开文件夹
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    let { path } = body
    
    if (!path) {
      return {
        ok: false,
        error: 'Path is required',
      }
    }
    
    // 替换 ~ 为实际主目录
    path = path.replace('~', homedir())
    
    // macOS 使用 open 命令
    execSync(`open "${path}"`)
    
    return {
      ok: true,
    }
  } catch (error: any) {
    console.error('Error opening folder:', error)
    return {
      ok: false,
      error: error.message || 'Failed to open folder',
    }
  }
})
