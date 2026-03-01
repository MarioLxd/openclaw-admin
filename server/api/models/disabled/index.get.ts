import { defineEventHandler } from 'h3'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.openclaw', 'openclaw-admin')
const CONFIG_FILE = join(CONFIG_DIR, 'disabled-models.json')

interface DisabledModelsConfig {
  disabledModels: string[] // 格式: "providerId/modelId"
}

// 读取配置
function readConfig(): DisabledModelsConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch (e) {
    // ignore
  }
  return { disabledModels: [] }
}

// 写入配置
function writeConfig(config: DisabledModelsConfig) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

// 获取禁用的模型列表
export default defineEventHandler(async () => {
  const config = readConfig()
  return {
    ok: true,
    result: config.disabledModels,
  }
})
