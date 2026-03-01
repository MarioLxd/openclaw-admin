import { defineEventHandler } from 'h3'
import { readFile, readdir, access } from 'fs/promises'
import { join, basename } from 'path'
import { homedir } from 'os'
import { constants } from 'fs'

export interface SkillInfo {
  id: string
  name: string
  description: string
  path: string
  source: 'extension' | 'extra-dir' | 'workspace'
  sourceLabel: string
}

// 解析 SKILL.md 的 frontmatter（YAML，格式：--- ... ---）
function parseFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return {}

  const yaml = match[1]
  const nameMatch = yaml.match(/^name:\s*(.+)$/m)
  const name = nameMatch?.[1]?.trim()

  // description 可以是单行或 | 多行格式
  let description: string | undefined
  const multilineMatch = yaml.match(/^description:\s*\|\s*\n((?:[ \t]+[^\n]*\n?)+)/m)
  if (multilineMatch) {
    description = multilineMatch[1].replace(/^[ \t]+/gm, '').trim()
  } else {
    const singleMatch = yaml.match(/^description:\s*(.+)$/m)
    description = singleMatch?.[1]?.trim()
  }

  return { name, description }
}

async function tryReadSkillMeta(dirPath: string): Promise<{ name: string; description: string } | null> {
  try {
    const skillMdPath = join(dirPath, 'SKILL.md')
    await access(skillMdPath, constants.R_OK)
    const content = await readFile(skillMdPath, 'utf-8')
    const meta = parseFrontmatter(content)
    return {
      name: meta.name || basename(dirPath),
      description: meta.description || '',
    }
  } catch {
    return null
  }
}

// 扫描一个目录，找出其中所有 skill（含 SKILL.md 的子目录）
// 若该目录本身就是 skill，直接返回单个
async function scanDir(
  dirPath: string,
  source: SkillInfo['source'],
  sourceLabel: string,
): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = []

  // 先检查目录本身是否是 skill
  const selfMeta = await tryReadSkillMeta(dirPath)
  if (selfMeta) {
    skills.push({
      id: basename(dirPath),
      ...selfMeta,
      path: dirPath,
      source,
      sourceLabel,
    })
    return skills
  }

  // 否则扫描子目录
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const subPath = join(dirPath, entry.name)
      const meta = await tryReadSkillMeta(subPath)
      if (meta) {
        skills.push({
          id: entry.name,
          ...meta,
          path: subPath,
          source,
          sourceLabel,
        })
      }
    }
  } catch {
    // 目录不存在或无权限
  }

  return skills
}

export default defineEventHandler(async () => {
  const home = homedir()
  const allSkills: SkillInfo[] = []
  const seen = new Set<string>()

  const addSkills = (skills: SkillInfo[]) => {
    for (const skill of skills) {
      if (!seen.has(skill.path)) {
        seen.add(skill.path)
        allSkills.push(skill)
      }
    }
  }

  // 1. 扫描扩展（~/.openclaw/extensions/*/skills/*）
  try {
    const extensionsDir = join(home, '.openclaw', 'extensions')
    const extEntries = await readdir(extensionsDir, { withFileTypes: true })
    for (const ext of extEntries) {
      if (!ext.isDirectory()) continue
      const extSkillsDir = join(extensionsDir, ext.name, 'skills')
      const extSkills = await scanDir(extSkillsDir, 'extension', ext.name)
      addSkills(extSkills)
    }
  } catch {
    // extensions 目录不存在
  }

  // 2. 读取配置中的 extraDirs
  try {
    const configPath = join(home, '.openclaw', 'openclaw.json')
    const configData = await readFile(configPath, 'utf-8')
    const config = JSON.parse(configData)
    const extraDirs: string[] = config?.skills?.load?.extraDirs || []

    for (const dir of extraDirs) {
      const resolvedDir = dir.replace(/^~/, home)
      const label = basename(resolvedDir)
      const dirSkills = await scanDir(resolvedDir, 'extra-dir', label)
      addSkills(dirSkills)
    }
  } catch {
    // 配置读取失败
  }

  // 3. 扫描所有 workspace 的 skills 目录（~/.openclaw/workspace-*/skills/）
  try {
    const openclawDir = join(home, '.openclaw')
    const entries = await readdir(openclawDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('workspace')) continue
      const wsSkillsDir = join(openclawDir, entry.name, 'skills')
      const wsSkills = await scanDir(wsSkillsDir, 'workspace', entry.name)
      addSkills(wsSkills)
    }
  } catch {
    // 忽略
  }

  return {
    ok: true,
    result: allSkills,
  }
})
