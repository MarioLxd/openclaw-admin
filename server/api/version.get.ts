import { defineEventHandler } from 'h3'
import { execSync } from 'child_process'

// 比较语义化版本
function compareVersions(current: string, latest: string): boolean {
  // 提取版本号中的数字部分 (2026.2.22-2 -> [2026, 2, 22, 2])
  const parseVersion = (v: string): number[] => {
    // 先把 - 替换成 .，然后提取所有数字
    const normalized = v.replace(/-/g, '.')
    const parts = normalized.match(/\d+/g) || []
    return parts.map(Number)
  }
  
  const currentParts = parseVersion(current)
  const latestParts = parseVersion(latest)
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0
    const l = latestParts[i] || 0
    if (l > c) {
      return true // 有更新
    } else if (l < c) {
      return false // 当前版本更新
    }
    // 相等则继续比较下一部分
  }
  
  return false // 版本相同
}

export default defineEventHandler(async () => {
  try {
    // 获取当前版本
    let currentVersion = 'unknown'
    try {
      const output = execSync('openclaw --version 2>/dev/null | tail -1 || echo "not found"').toString().trim()
      if (output && output !== 'not found' && !output.includes('Config warnings')) {
        currentVersion = output
      }
    } catch (e) {
      // 忽略错误
    }
    
    // 如果无法获取版本，尝试从配置文件中读取
    if (currentVersion === 'unknown') {
      try {
        const { readFileSync } = await import('fs')
        const { join } = await import('path')
        const { homedir } = await import('os')
        const configPath = join(homedir(), '.openclaw', 'openclaw.json')
        const config = JSON.parse(readFileSync(configPath, 'utf-8'))
        currentVersion = config.meta?.lastTouchedVersion || 'unknown'
      } catch (e) {
        // 忽略错误
      }
    }
    
    // 尝试获取最新版本
    let latestVersion = currentVersion
    let updateAvailable = false
    
    try {
      // 使用 npm 检查最新版本
      const npmOutput = execSync('npm view openclaw version 2>/dev/null || echo ""').toString().trim()
      if (npmOutput) {
        latestVersion = npmOutput
        
        // 使用改进的版本比较
        updateAvailable = compareVersions(currentVersion, latestVersion)
      }
    } catch (e) {
      // 忽略 npm 检查错误
    }
    
    return {
      ok: true,
      result: {
        currentVersion,
        latestVersion,
        updateAvailable,
      },
    }
  } catch (error: any) {
    console.error('Error checking version:', error)
    return {
      ok: false,
      error: error.message || 'Failed to check version',
    }
  }
})
