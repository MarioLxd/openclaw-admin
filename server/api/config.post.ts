import { defineEventHandler, readBody } from 'h3'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

// 替换整个配置
export default defineEventHandler(async (event) => {
  try {
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    
    // 获取请求体（完整配置）
    const body = await readBody(event)
    
    // 更新元数据
    body.meta = {
      ...body.meta,
      lastTouchedAt: new Date().toISOString(),
    }
    
    // 写回文件
    await writeFile(configPath, JSON.stringify(body, null, 2), 'utf-8')
    
    return {
      ok: true,
      result: body
    }
  } catch (error: any) {
    console.error('Error applying config:', error)
    return {
      ok: false,
      error: error.message || 'Failed to apply config'
    }
  }
})
