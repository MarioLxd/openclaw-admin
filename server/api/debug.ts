import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  return {
    gatewayUrl: config.public.openclawGatewayUrl,
    hasToken: !!config.openclawGatewayToken,
  }
})
