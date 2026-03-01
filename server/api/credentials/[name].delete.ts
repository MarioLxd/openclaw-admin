import { defineEventHandler, getRouterParam } from 'h3'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const CREDENTIALS_DIR = join(homedir(), '.openclaw', 'credentials')

export default defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, 'name')
    
    if (!name) {
      return {
        ok: false,
        error: 'Credential name is required',
      }
    }
    
    const filepath = join(CREDENTIALS_DIR, name)
    await unlink(filepath)
    
    return {
      ok: true,
    }
  } catch (error: any) {
    console.error('Error deleting credential:', error)
    return {
      ok: false,
      error: error.message || 'Failed to delete credential',
    }
  }
})
