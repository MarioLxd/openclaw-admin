import { defineEventHandler, readBody } from 'h3'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const CREDENTIALS_DIR = join(homedir(), '.openclaw', 'credentials')

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { provider, profile, apiKey } = body
    
    if (!provider || !apiKey) {
      return {
        ok: false,
        error: 'Provider and API key are required',
      }
    }
    
    const filename = `${provider}_${profile || 'default'}`
    const filepath = join(CREDENTIALS_DIR, filename)
    
    await writeFile(filepath, apiKey, 'utf-8')
    
    return {
      ok: true,
      result: { filename },
    }
  } catch (error: any) {
    console.error('Error saving credential:', error)
    return {
      ok: false,
      error: error.message || 'Failed to save credential',
    }
  }
})
