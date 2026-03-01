<script setup lang="ts">
import { 
  Plus, Trash2, RefreshCw, AlertCircle, Clock, Play, Pause, 
  CheckCircle, XCircle, Calendar, Zap, History, Search,
  ChevronDown, ChevronRight, Bot, MessageSquare, Settings
} from 'lucide-vue-next'

// 任务列表
const jobs = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

// 调度器状态
const schedulerStatus = ref<any>(null)

// 加载任务列表
const loadJobs = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/cron')
    if (response.ok) {
      jobs.value = response.result || []
    } else {
      error.value = response.error
    }
  } catch (e: any) {
    error.value = e.message
  }
  
  loading.value = false
}

// 加载调度器状态
const loadStatus = async () => {
  try {
    const response = await $fetch('/api/cron/status')
    if (response.ok) {
      schedulerStatus.value = response.result
    }
  } catch (e) {
    // ignore
  }
}

const refreshAll = async () => {
  await Promise.all([loadJobs(), loadStatus()])
}

// 删除任务
const deleteJob = async (name: string) => {
  if (!confirm(`确定要删除任务 "${name}" 吗？`)) return
  
  try {
    const response = await $fetch(`/api/cron/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      await loadJobs()
    } else {
      alert('删除失败: ' + response.error)
    }
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

// 切换任务状态
const toggleJob = async (job: any) => {
  try {
    const response = await $fetch(`/api/cron/${encodeURIComponent(job.name)}`, {
      method: 'PATCH',
      body: { enabled: !job.enabled },
    })
    if (response.ok) {
      await loadJobs()
    } else {
      alert('操作失败: ' + response.error)
    }
  } catch (e: any) {
    alert('操作失败: ' + e.message)
  }
}

// 立即运行任务
const runJob = async (name: string) => {
  if (!confirm(`确定要立即运行任务 "${name}" 吗？`)) return
  
  try {
    const response = await $fetch(`/api/cron/${encodeURIComponent(name)}/run`, {
      method: 'POST',
    })
    if (response.ok) {
      alert('任务已触发')
      await loadJobs()
    } else {
      alert('运行失败: ' + response.error)
    }
  } catch (e: any) {
    alert('运行失败: ' + e.message)
  }
}

// 添加任务 Modal
const showAddModal = ref(false)
const saving = ref(false)
const newJob = ref({
  name: '',
  cron: '',
  every: '',
  at: '',
  message: '',
  agent: '',
  to: '',
  channel: '',
  description: '',
  timezone: '',
  disabled: false,
})

// 添加任务
const addJob = async () => {
  if (!newJob.value.name) {
    alert('请输入任务名称')
    return
  }
  
  if (!newJob.value.cron && !newJob.value.every && !newJob.value.at) {
    alert('请设置调度时间（cron、every 或 at）')
    return
  }
  
  if (!newJob.value.message && !newJob.value.agent) {
    alert('请输入消息内容或选择 Agent')
    return
  }
  
  saving.value = true
  
  try {
    const response = await $fetch('/api/cron/add', {
      method: 'POST',
      body: newJob.value,
    })
    
    if (response.ok) {
      showAddModal.value = false
      newJob.value = {
        name: '',
        cron: '',
        every: '',
        at: '',
        message: '',
        agent: '',
        to: '',
        channel: '',
        description: '',
        timezone: '',
        disabled: false,
      }
      await loadJobs()
    } else {
      alert('添加失败: ' + response.error)
    }
  } catch (e: any) {
    alert('添加失败: ' + e.message)
  }
  
  saving.value = false
}

// 过滤任务
const filteredJobs = computed(() => {
  if (!searchQuery.value) return jobs.value
  const query = searchQuery.value.toLowerCase()
  return jobs.value.filter(job => 
    job.name?.toLowerCase().includes(query) ||
    job.message?.toLowerCase().includes(query) ||
    job.description?.toLowerCase().includes(query)
  )
})

// 格式化下次运行时间
const formatNextRun = (nextRun: string | number) => {
  if (!nextRun) return '-'
  try {
    const date = new Date(nextRun)
    return date.toLocaleString('zh-CN')
  } catch {
    return String(nextRun)
  }
}

// Cron 表达式说明
const cronExamples = [
  { expr: '*/5 * * * *', desc: '每 5 分钟' },
  { expr: '0 * * * *', desc: '每小时整点' },
  { expr: '0 9 * * *', desc: '每天 9:00' },
  { expr: '0 9 * * 1', desc: '每周一 9:00' },
  { expr: '0 9 1 * *', desc: '每月 1 日 9:00' },
  { expr: '0 9,18 * * *', desc: '每天 9:00 和 18:00' },
]

// Duration 示例（用于 --every）
const durationExamples = [
  { expr: '10m', desc: '每 10 分钟' },
  { expr: '1h', desc: '每 1 小时' },
  { expr: '30s', desc: '每 30 秒' },
  { expr: '2h', desc: '每 2 小时' },
]

onMounted(() => {
  refreshAll()
})
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">定时任务</h1>
        <p class="text-gray-500 mt-1">管理 OpenClaw 的定时任务调度</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="refreshAll"
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
          @click="showAddModal = true"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          添加任务
        </button>
      </div>
    </div>

    <!-- Scheduler Status -->
    <div v-if="schedulerStatus" class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div class="flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-gray-500" />
          <span class="text-gray-600">调度器状态:</span>
          <span 
            :class="schedulerStatus.running ? 'text-green-600' : 'text-red-600'"
            class="font-medium"
          >
            {{ schedulerStatus.running ? '运行中' : '已停止' }}
          </span>
        </div>
        <div v-if="schedulerStatus.jobsCount !== undefined" class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-gray-500" />
          <span class="text-gray-600">任务数量:</span>
          <span class="font-medium text-gray-900">{{ schedulerStatus.jobsCount }}</span>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-500" />
      <div>
        <p class="font-medium text-red-900">加载失败</p>
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          autocomplete="off"
          placeholder="搜索任务..."
          class="input pl-10"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>

    <!-- Jobs List -->
    <div v-else-if="filteredJobs.length > 0" class="space-y-4">
      <div
        v-for="job in filteredJobs"
        :key="job.name"
        class="card p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div 
              :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center',
                job.enabled ? 'bg-green-100' : 'bg-gray-100'
              ]"
            >
              <Clock 
                :class="['w-5 h-5', job.enabled ? 'text-green-600' : 'text-gray-400']" 
              />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900">{{ job.name }}</h3>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    job.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ job.enabled ? '已启用' : '已禁用' }}
                </span>
              </div>
              <p v-if="job.description" class="text-sm text-gray-500 mt-0.5">{{ job.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button 
              @click="runJob(job.name)"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="立即运行"
            >
              <Play class="w-4 h-4 text-gray-500" />
            </button>
            <button 
              @click="toggleJob(job)"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              :title="job.enabled ? '禁用' : '启用'"
            >
              <Pause v-if="job.enabled" class="w-4 h-4 text-gray-500" />
              <CheckCircle v-else class="w-4 h-4 text-green-500" />
            </button>
            <button 
              @click="deleteJob(job.name)"
              class="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 class="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <!-- 调度时间 -->
          <div>
            <span class="text-gray-500 block mb-1">调度时间</span>
            <code class="bg-gray-100 px-2 py-1 rounded text-xs">
              {{ job.cron || job.every || job.at || '-' }}
            </code>
          </div>
          
          <!-- Agent / 消息 -->
          <div>
            <span class="text-gray-500 block mb-1">
              {{ job.agent ? 'Agent' : '消息' }}
            </span>
            <div class="flex items-center gap-1">
              <Bot v-if="job.agent" class="w-4 h-4 text-primary-500" />
              <MessageSquare v-else class="w-4 h-4 text-gray-400" />
              <span class="truncate">{{ job.agent || job.message || '-' }}</span>
            </div>
          </div>
          
          <!-- 目标 -->
          <div>
            <span class="text-gray-500 block mb-1">目标</span>
            <span class="text-gray-900">{{ job.to || job.channel || '-' }}</span>
          </div>
          
          <!-- 下次运行 -->
          <div>
            <span class="text-gray-500 block mb-1">下次运行</span>
            <span class="text-gray-900">{{ formatNextRun(job.nextRun) }}</span>
          </div>
        </div>

        <!-- 上次运行结果 -->
        <div v-if="job.lastRun" class="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <History class="w-4 h-4 text-gray-400" />
            <span class="text-gray-500">上次运行:</span>
            <span class="text-gray-900">{{ formatNextRun(job.lastRun) }}</span>
          </div>
          <div v-if="job.lastResult !== undefined" class="flex items-center gap-2">
            <CheckCircle v-if="job.lastResult" class="w-4 h-4 text-green-500" />
            <XCircle v-else class="w-4 h-4 text-red-500" />
            <span :class="job.lastResult ? 'text-green-600' : 'text-red-600'">
              {{ job.lastResult ? '成功' : '失败' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">暂无定时任务</h3>
      <p class="text-gray-500">点击上方按钮添加任务</p>
      <button 
        @click="showAddModal = true"
        class="btn-primary inline-flex items-center gap-2 mt-4"
      >
        <Plus class="w-4 h-4" />
        添加任务
      </button>
    </div>

    <!-- Add Job Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 class="text-lg font-semibold text-gray-900">添加定时任务</h3>
          <p class="text-sm text-gray-500 mt-1">创建新的定时任务</p>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- 基本信息 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="label">任务名称 *</label>
                <input 
                  v-model="newJob.name"
                  type="text"
                  class="input"
                  placeholder="例如: daily-report"
                />
              </div>
              <div class="col-span-2">
                <label class="label">描述</label>
                <input 
                  v-model="newJob.description"
                  type="text"
                  class="input"
                  placeholder="任务描述（可选）"
                />
              </div>
            </div>
          </div>

          <!-- 调度时间 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">调度时间 *（三选一）</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="label">Cron 表达式</label>
                <input 
                  v-model="newJob.cron"
                  type="text"
                  class="input"
                  placeholder="0 9 * * *"
                  :disabled="!!newJob.every || !!newJob.at"
                />
              </div>
              <div>
                <label class="label">间隔时间</label>
                <input 
                  v-model="newJob.every"
                  type="text"
                  class="input"
                  placeholder="1h, 30m"
                  :disabled="!!newJob.cron || !!newJob.at"
                />
              </div>
              <div>
                <label class="label">一次性执行</label>
                <input 
                  v-model="newJob.at"
                  type="text"
                  class="input"
                  placeholder="+20m 或 ISO 时间"
                  :disabled="!!newJob.cron || !!newJob.every"
                />
              </div>
            </div>
            
            <!-- Cron 示例 -->
            <div class="mt-3 p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500 mb-2">常用 Cron 表达式:</p>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div v-for="ex in cronExamples" :key="ex.expr" class="flex items-center gap-2">
                  <code class="bg-gray-200 px-1 rounded">{{ ex.expr }}</code>
                  <span class="text-gray-600">{{ ex.desc }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 任务内容 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">任务内容</h4>
            <div class="space-y-4">
              <div>
                <label class="label">消息内容 *</label>
                <textarea 
                  v-model="newJob.message"
                  class="input"
                  rows="3"
                  placeholder="输入要发送给 Agent 的消息..."
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Agent ID</label>
                  <input 
                    v-model="newJob.agent"
                    type="text"
                    class="input"
                    placeholder="留空使用默认 Agent"
                  />
                </div>
                <div>
                  <label class="label">时区</label>
                  <input 
                    v-model="newJob.timezone"
                    type="text"
                    class="input"
                    placeholder="Asia/Shanghai"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 通知设置 -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">通知设置（可选）</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">发送到</label>
                <input 
                  v-model="newJob.to"
                  type="text"
                  class="input"
                  placeholder="手机号 / Chat ID"
                />
              </div>
              <div>
                <label class="label">渠道</label>
                <input 
                  v-model="newJob.channel"
                  type="text"
                  class="input"
                  placeholder="feishu, telegram..."
                />
              </div>
            </div>
          </div>

          <!-- 高级选项 -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input 
                v-model="newJob.disabled" 
                type="checkbox" 
                class="w-4 h-4 text-primary-600 border-gray-300 rounded" 
              />
              <span class="text-sm text-gray-700">创建后立即禁用</span>
            </label>
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button 
            @click="showAddModal = false"
            class="btn-secondary"
          >
            取消
          </button>
          <button 
            @click="addJob"
            :disabled="saving"
            class="btn-primary disabled:opacity-50"
          >
            {{ saving ? '添加中...' : '添加任务' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
