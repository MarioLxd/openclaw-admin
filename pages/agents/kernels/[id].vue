<script setup lang="ts">
import { 
  Save, RefreshCw, ArrowLeft, AlertCircle, CheckCircle, 
  FileText, User, Bot, Heart, Wrench, Clock 
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useOpenClawStore()

const agentId = computed(() => route.params.id as string)

// 内核文件数据
const kernels = ref<{
  name: string
  description: string
  required: boolean
  content: string
  exists: boolean
}[]>([])

const workspace = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// 文件图标映射
const fileIcons: Record<string, any> = {
  'SOUL.md': FileText,
  'AGENTS.md': Bot,
  'IDENTITY.md': User,
  'USER.md': User,
  'TOOLS.md': Wrench,
  'HEARTBEAT.md': Clock,
}

// 加载内核配置
const loadKernels = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch(`/api/agents/kernels/${agentId.value}`)
    if (response.ok && response.result) {
      kernels.value = response.result.kernels
      workspace.value = response.result.workspace
    } else {
      error.value = response.error || 'Failed to load kernels'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load kernels'
  }
  
  loading.value = false
}

// 保存内核配置
const saveKernels = async () => {
  saving.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/agents/kernels/${agentId.value}`, {
      method: 'PATCH',
      body: { kernels: kernels.value },
    })
    
    if (response.ok) {
      successMessage.value = '保存成功！'
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    } else {
      error.value = response.error || 'Failed to save kernels'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to save kernels'
  }
  
  saving.value = false
}

// 获取 agent 信息
const agent = computed(() => {
  return store.agents.find(a => a.id === agentId.value)
})

onMounted(async () => {
  if (!store.config) {
    await store.loadConfig()
  }
  await loadKernels()
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <NuxtLink 
          to="/agents" 
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">内核配置</h1>
          <p class="text-gray-500 mt-1">
            Agent: <span class="font-medium">{{ agent?.identity?.name || agentId }}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="loadKernels"
          :disabled="loading"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': loading }" 
          />
          刷新
        </button>
        <button 
          @click="saveKernels"
          :disabled="saving"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Save class="w-4 h-4" />
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
      <CheckCircle class="w-5 h-5 text-green-500" />
      <span class="text-green-900">{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-500" />
      <div>
        <p class="font-medium text-red-900">错误</p>
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Workspace Info -->
    <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p class="text-sm text-gray-600">
        <span class="font-medium">工作目录:</span> 
        <code class="bg-gray-100 px-2 py-1 rounded text-xs">{{ workspace }}</code>
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载内核配置...</p>
    </div>

    <!-- Kernels Editor -->
    <div v-else class="space-y-6">
      <div 
        v-for="kernel in kernels" 
        :key="kernel.name"
        class="card p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <component 
              :is="fileIcons[kernel.name] || FileText" 
              class="w-5 h-5 text-gray-500"
            />
            <div>
              <h3 class="font-semibold text-gray-900">{{ kernel.name }}</h3>
              <p class="text-sm text-gray-500">{{ kernel.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span 
              v-if="kernel.exists"
              class="text-xs text-green-600 flex items-center gap-1"
            >
              <CheckCircle class="w-3 h-3" />
              已创建
            </span>
            <span 
              v-if="kernel.required && !kernel.exists"
              class="text-xs text-red-600 flex items-center gap-1"
            >
              <AlertCircle class="w-3 h-3" />
              必需
            </span>
            <span 
              v-if="!kernel.required && !kernel.exists"
              class="text-xs text-gray-400"
            >
              可选
            </span>
          </div>
        </div>
        
        <textarea
          v-model="kernel.content"
          :rows="kernel.name === 'SOUL.md' || kernel.name === 'AGENTS.md' ? 12 : 6"
          class="input font-mono text-sm"
          :placeholder="`请输入 ${kernel.name} 内容...`"
        />
        
        <p class="mt-2 text-xs text-gray-400">
          <template v-if="kernel.name === 'SOUL.md'">
            定义 agent 的核心人格、说话风格、技术栈偏好
          </template>
          <template v-else-if="kernel.name === 'AGENTS.md'">
            定义 agent 的工作流程、工具使用规范、安全边界
          </template>
          <template v-else-if="kernel.name === 'IDENTITY.md'">
            定义 agent 的名字、Emoji、对外身份描述
          </template>
          <template v-else-if="kernel.name === 'USER.md'">
            关于当前用户的上下文信息（可选）
          </template>
          <template v-else-if="kernel.name === 'TOOLS.md'">
            本地工具配置如 SSH、摄像头、语音等
          </template>
          <template v-else-if="kernel.name === 'HEARTBEAT.md'">
            定期执行的后台任务配置
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
