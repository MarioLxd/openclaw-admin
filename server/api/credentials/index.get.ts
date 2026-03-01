import { defineEventHandler, getRouterParam } from 'h3'
import { readdir, readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const CREDENTIALS_DIR = join(homedir(), '.openclaw', 'credentials')

// 获取凭据列表
export default defineEventHandler(async () => {
  try {
    const files = await readdir(CREDENTIALS_DIR)
    
    const credentials = files
      .filter(f => !f.startsWith('.'))
      .map(filename => {
        // 移除 .json 后缀（如果有）
        const cleanName = filename.replace(/\.json$/, '')
        // 按 _ 分割获取 provider 和 profile
        const parts = cleanName.split('_')
        const provider = parts[0]
        const profile = parts.length > 1 ? parts.slice(1).join('_') : 'default'
        return {
          name: filename,
          provider,
          profile,
          hasKey: true,
        }
      })
    
    return {
      ok: true,
      result: credentials,
    }
  } catch (error: any) {
    console.error('Error reading credentials:', error)
    return {
      ok: false,
      error: error.message || 'Failed to read credentials',
    }
  }
})
