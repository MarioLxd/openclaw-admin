import { defineEventHandler, readBody } from 'h3'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

// 直接修改配置文件
export default defineEventHandler(async (event) => {
  try {
    const configPath = join(homedir(), '.openclaw', 'openclaw.json')
    
    // 读取当前配置
    const configData = await readFile(configPath, 'utf-8')
    const config = JSON.parse(configData)
    
    // 获取请求体（部分更新）
    const body = await readBody(event)
    
    // 合并配置（浅合并）
    const updatedConfig = { ...config, ...body }
    
    // 更新元数据
    updatedConfig.meta = {
      ...config.meta,
      lastTouchedAt: new Date().toISOString(),
      lastTouchedVersion: config.meta?.lastTouchedVersion || 'unknown'
    }
    
    // 写回文件
    await writeFile(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8')
    
    return {
      ok: true,
      result: updatedConfig
    }
  } catch (error: any) {
    console.error('Error updating config:', error)
    return {
      ok: false,
      error: error.message || 'Failed to update config'
    }
  }
})
