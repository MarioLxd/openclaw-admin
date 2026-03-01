<script setup lang="ts">
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const store = useOpenClawStore()
const api = useOpenClawApi()

const isSubmitting = ref(false)

const form = ref({
  id: '',
  name: '',
  workspace: '',
  model: 'minimax-cn/MiniMax-M2.5',
  identity: {
    name: '',
    theme: '',
    emoji: '🤖'
  },
  default: false
})

// 页面加载时获取模型列表
onMounted(() => {
  if (!store.config) {
    store.loadConfig()
  }
})

// 可用的模型列表
const availableModels = computed(() => {
  const models: { value: string; label: string }[] = []
  
  if (store.config?.models?.providers) {
    Object.entries(store.config.models.providers).forEach(([providerId, provider]) => {
      provider.models.forEach(model => {
        models.push({
          value: `${providerId}/${model.id}`,
          label: `${providerId} - ${model.name}`
        })
      })
    })
  }
  
  // 默认模型
  if (models.length === 0) {
    models.push(
      { value: 'minimax-cn/MiniMax-M2.5', label: 'minimax-cn - MiniMax M2.5' },
      { value: 'moonshot/kimi-k2.5', label: 'moonshot - Kimi K2.5' },
      { value: 'zhipu/glm-5', label: 'zhipu - GLM-5' },
    )
  }
  
  return models
})

const emojis = ['🤖', '👾', '🔵', '🔴', '🟢', '🟡', '🟣', '⚡', '🔥', '💎', '🚀', '🌟']

const handleSubmit = async () => {
  if (!form.value.id || !form.value.name || !form.value.workspace) {
    alert('请填写必填字段')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const response = await $fetch('/api/agents/create', {
      method: 'POST',
      body: {
        id: form.value.id,
        name: form.value.name,
        workspace: form.value.workspace,
        model: { primary: form.value.model },
        identity: form.value.identity,
        isDefault: form.value.default,
      },
    })
    
    if (response.ok) {
      await store.loadConfig()
      router.push('/agents')
    } else {
      alert('创建失败: ' + (response.error || '未知错误'))
    }
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  }
  
  isSubmitting.value = false
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink to="/agents" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-600" />
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新建 Agent</h1>
        <p class="text-gray-500 mt-1">创建一个新的 OpenClaw Agent</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="max-w-2xl">
      <div class="card p-6 space-y-6">
        <!-- Basic Info -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Agent ID</label>
              <input
                v-model="form.id"
                type="text"
                placeholder="例如: my-bot"
                class="input"
                required
              />
              <p class="text-xs text-gray-500 mt-1">唯一标识符，不可重复</p>
            </div>
            <div>
              <label class="label">显示名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="例如: My Bot"
                class="input"
                required
              />
            </div>
          </div>
        </div>

        <!-- Identity -->
        <div class="border-t border-gray-200 pt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">身份配置</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">AI 名称</label>
              <input
                v-model="form.identity.name"
                type="text"
                placeholder="例如: 小助手"
                class="input"
                required
              />
            </div>
            <div>
              <label class="label">主题描述</label>
              <input
                v-model="form.identity.theme"
                type="text"
                placeholder="例如: friendly and helpful"
                class="input"
                required
              />
            </div>
          </div>
          <div class="mt-4">
            <label class="label">选择 Emoji</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="emoji in emojis"
                :key="emoji"
                type="button"
                @click="form.identity.emoji = emoji"
                :class="[
                  'w-10 h-10 text-xl rounded-lg border-2 transition-all',
                  form.identity.emoji === emoji
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>

        <!-- Model & Workspace -->
        <div class="border-t border-gray-200 pt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">模型与工作目录</h2>
          <div class="space-y-4">
            <div>
              <label class="label">默认模型</label>
              <select v-model="form.model" class="input">
                <option v-for="model in availableModels" :key="model.value" :value="model.value">
                  {{ model.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">工作目录</label>
              <input
                v-model="form.workspace"
                type="text"
                placeholder="例如: /Users/mario/.openclaw/workspace-new"
                class="input"
                required
              />
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="border-t border-gray-200 pt-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.default"
              type="checkbox"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700">设为默认 Agent</span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-4 mt-6">
        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ isSubmitting ? '保存中...' : '保存 Agent' }}
        </button>
        <NuxtLink to="/agents" class="btn-secondary">
          取消
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
