import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

// 直接从文件读取配置，因为 Gateway 没有提供 HTTP API
export default defineEventHandler(async (event) => {
  try {
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    const configData = await readFile(configPath, 'utf-8')
    const config = JSON.parse(configData)
    
    return {
      ok: true,
      result: config
    }
  } catch (error: any) {
    console.error('Error reading config:', error)
    return {
      ok: false,
      error: error.message || 'Failed to read config'
    }
  }
})
