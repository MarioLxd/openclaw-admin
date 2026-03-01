import { defineEventHandler, readBody } from 'h3'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.openclaw', 'openclaw-admin')
const CONFIG_FILE = join(CONFIG_DIR, 'disabled-models.json')

interface DisabledModelsConfig {
  disabledModels: string[]
}

function readConfig(): DisabledModelsConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch (e) {}
  return { disabledModels: [] }
}

function writeConfig(config: DisabledModelsConfig) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

// 更新模型禁用状态
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { providerId, modelId, disabled } = body
  
  if (!providerId || !modelId) {
    return { ok: false, error: 'providerId and modelId are required' }
  }
  
  const key = `${providerId}/${modelId}`
  const config = readConfig()
  
  if (disabled) {
    if (!config.disabledModels.includes(key)) {
      config.disabledModels.push(key)
    }
  } else {
    config.disabledModels = config.disabledModels.filter(k => k !== key)
  }
  
  writeConfig(config)
  
  return { ok: true, result: { key, disabled } }
})
