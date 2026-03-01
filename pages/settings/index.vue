<script setup lang="ts">
import { Save, Download, Upload, RotateCcw, FileJson, RefreshCw, AlertCircle } from 'lucide-vue-next'

const store = useOpenClawStore()

// 页面加载时获取配置
onMounted(() => {
  if (!store.config) {
    store.loadConfig()
  }
})

const isSaving = ref(false)
const saveMessage = ref('')

// 本地表单状态
const settings = computed({
  get: () => ({
    messages: store.config?.messages || { ackReactionScope: 'group-mentions' },
    commands: store.config?.commands || { native: 'auto', nativeSkills: 'auto' },
    plugins: store.config?.plugins || { entries: { feishu: { enabled: true } } },
  }),
  set: () => {}
})

const ackReactionOptions = [
  { value: 'group-mentions', label: '仅群组提及' },
  { value: 'all', label: '所有消息' },
  { value: 'none', label: '无' },
]

const commandModes = [
  { value: 'auto', label: '自动' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用' },
]

const saveSettings = async () => {
  isSaving.value = true
  saveMessage.value = ''
  
  const result = await store.saveConfigPatch({
    messages: settings.value.messages,
    commands: settings.value.commands,
    plugins: settings.value.plugins,
  })
  
  if (result) {
    saveMessage.value = '设置已保存'
    setTimeout(() => saveMessage.value = '', 3000)
  } else {
    saveMessage.value = '保存失败: ' + store.error
  }
  
  isSaving.value = false
}

const exportConfig = () => {
  if (!store.config) return
  
  const dataStr = JSON.stringify(store.config, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `openclaw-config-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        // 这里可以添加配置验证逻辑
        await store.saveConfigPatch(imported)
        alert('配置已导入')
      } catch (err) {
        alert('导入失败：无效的配置文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const resetConfig = async () => {
  if (!confirm('确定要重置所有设置为默认值吗？此操作不可恢复。')) return
  
  // 重置为默认配置
  const defaultConfig = {
    messages: { ackReactionScope: 'group-mentions' },
    commands: { native: 'auto', nativeSkills: 'auto' },
    plugins: { entries: { feishu: { enabled: true } } }
  }
  
  await store.saveConfigPatch(defaultConfig)
  alert('配置已重置')
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">系统设置</h1>
        <p class="text-gray-500 mt-1">配置 OpenClaw 的其他设置</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="store.loadConfig()"
          :disabled="store.loading"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': store.loading }" 
          />
          刷新
        </button>
        <button 
          @click="exportConfig"
          :disabled="!store.config"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <Download class="w-4 h-4" />
          导出配置
        </button>
        <button 
          @click="importConfig"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <Upload class="w-4 h-4" />
          导入配置
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="store.error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-500" />
      <div>
        <p class="font-medium text-red-900">加载失败</p>
        <p class="text-sm text-red-700">{{ store.error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else class="max-w-3xl space-y-6">
      <!-- Messages Settings -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-6">
          <FileJson class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">消息设置</h2>
        </div>
        <div>
          <label class="label">确认反应范围</label>
          <select v-model="settings.messages.ackReactionScope" class="input max-w-md">
            <option v-for="opt in ackReactionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p class="text-sm text-gray-500 mt-2">
            控制 Agent 在哪些情况下会发送确认反应（如 👍）
          </p>
        </div>
      </div>

      <!-- Commands Settings -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-6">
          <RotateCcw class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">命令设置</h2>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="label">原生命令</label>
            <select v-model="settings.commands.native" class="input">
              <option v-for="mode in commandModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">原生 Skills 命令</label>
            <select v-model="settings.commands.nativeSkills" class="input">
              <option v-for="mode in commandModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Plugins Settings -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">插件设置</h2>
        <div class="space-y-4">
          <div 
            v-for="(plugin, pluginId) in settings.plugins.entries" 
            :key="pluginId"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <h3 class="font-medium text-gray-900 capitalize">{{ pluginId }} 插件</h3>
              <p class="text-sm text-gray-500">{{ pluginId }} 消息渠道支持</p>
            </div>
            <button
              @click="plugin.enabled = !plugin.enabled"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                plugin.enabled ? 'bg-primary-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  plugin.enabled ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <button 
          @click="resetConfig"
          class="text-red-600 hover:text-red-700 text-sm font-medium inline-flex items-center gap-2"
        >
          <RotateCcw class="w-4 h-4" />
          重置为默认
        </button>
        <div class="flex items-center gap-4">
          <p v-if="saveMessage" :class="['text-sm', saveMessage.includes('失败') ? 'text-red-600' : 'text-green-600']">
            {{ saveMessage }}
          </p>
          <button 
            @click="saveSettings"
            :disabled="isSaving"
            class="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ isSaving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
