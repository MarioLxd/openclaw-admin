<script setup lang="ts">
import {
  Brain,
  RefreshCw,
  CalendarDays,
  Database,
  Trash2,
  FileText,
  Search,
  Save,
  X,
  Clock,
  Plus,
} from 'lucide-vue-next'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgentMemory {
  id: string
  name: string
  emoji: string
  identityName: string
  workspace: string
  shortTermCount: number
  shortTermDates: string[]
  longTermCount: number
  longTermExists: boolean
}

interface ShortTermFile {
  date: string
  filename: string
  size: number
  mtime: string
}

interface LongTermChunk {
  id: string
  path: string
  source: string
  start_line: number
  end_line: number
  text: string
  updated_at: number
}

// ─── State ───────────────────────────────────────────────────────────────────
const agents = ref<AgentMemory[]>([])
const loading = ref(false)
const selectedAgentId = ref<string | null>(null)
const activeTab = ref<'short' | 'long'>('short')

// Short-term state
const shortTermFiles = ref<ShortTermFile[]>([])
const loadingShort = ref(false)
const selectedDate = ref<string | null>(null)
const fileContent = ref('')
const loadingContent = ref(false)
const saving = ref(false)
const isDirty = ref(false)

// Long-term state
const longTermChunks = ref<LongTermChunk[]>([])
const longTermTotal = ref(0)
const loadingLong = ref(false)
const longSearch = ref('')
const longOffset = ref(0)
const longLimit = 30
let searchTimer: ReturnType<typeof setTimeout> | null = null

// MEMORY.md (核心长期记忆)
const coreContent = ref('')
const loadingCore = ref(false)
const savingCore = ref(false)
const isCoreDirty = ref(false)

// New file dialog
const showNewFileDialog = ref(false)
const newFileDate = ref('')

// ─── Computed ────────────────────────────────────────────────────────────────
const selectedAgent = computed(() => agents.value.find(a => a.id === selectedAgentId.value))

// ─── Load agents ─────────────────────────────────────────────────────────────
const loadAgents = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ ok: boolean; result: AgentMemory[] }>('/api/memory/agents')
    if (res.ok) {
      agents.value = res.result
      if (!selectedAgentId.value && res.result.length > 0) {
        selectAgent(res.result[0].id)
      }
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

// ─── Agent selection ─────────────────────────────────────────────────────────
const selectAgent = async (id: string) => {
  selectedAgentId.value = id
  selectedDate.value = null
  fileContent.value = ''
  isDirty.value = false
  longSearch.value = ''
  longOffset.value = 0

  if (activeTab.value === 'short') {
    await loadShortTermFiles(id)
  } else {
    await Promise.all([loadCoreMemory(id), loadLongTermChunks(id)])
  }
}

const switchTab = async (tab: 'short' | 'long') => {
  activeTab.value = tab
  if (!selectedAgentId.value) return
  if (tab === 'short') {
    await loadShortTermFiles(selectedAgentId.value)
  } else {
    await Promise.all([loadCoreMemory(selectedAgentId.value), loadLongTermChunks(selectedAgentId.value)])
  }
}

// ─── Short-term memory ───────────────────────────────────────────────────────
const loadShortTermFiles = async (agentId: string) => {
  loadingShort.value = true
  try {
    const res = await $fetch<{ ok: boolean; result: ShortTermFile[] }>(`/api/memory/short-term/${agentId}`)
    if (res.ok) shortTermFiles.value = res.result
  } catch (e) {
    console.error(e)
  }
  loadingShort.value = false
}

const selectDate = async (date: string) => {
  if (isDirty.value && !confirm('有未保存的更改，确定要切换吗？')) return
  selectedDate.value = date
  isDirty.value = false
  loadingContent.value = true
  try {
    const res = await $fetch<{ ok: boolean; result: { date: string; content: string } }>(
      `/api/memory/short-term/${selectedAgentId.value}/${date}`
    )
    if (res.ok) fileContent.value = res.result.content
  } catch (e) {
    console.error(e)
  }
  loadingContent.value = false
}

const saveFile = async () => {
  if (!selectedAgentId.value || !selectedDate.value) return
  saving.value = true
  try {
    const res = await $fetch<{ ok: boolean; error?: string }>(
      `/api/memory/short-term/${selectedAgentId.value}/${selectedDate.value}`,
      { method: 'PUT', body: { content: fileContent.value } }
    )
    if (res.ok) {
      isDirty.value = false
      // Refresh list
      await loadShortTermFiles(selectedAgentId.value)
      await loadAgents()
    } else {
      alert('保存失败: ' + res.error)
    }
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  }
  saving.value = false
}

const deleteFile = async (date: string) => {
  if (!confirm(`确定要删除 ${date} 的记忆文件吗？此操作不可恢复。`)) return
  try {
    const res = await $fetch<{ ok: boolean; error?: string }>(
      `/api/memory/short-term/${selectedAgentId.value}/${date}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      if (selectedDate.value === date) {
        selectedDate.value = null
        fileContent.value = ''
        isDirty.value = false
      }
      await loadShortTermFiles(selectedAgentId.value!)
      await loadAgents()
    } else {
      alert('删除失败: ' + res.error)
    }
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

const createNewFile = async () => {
  if (!newFileDate.value || !/^\d{4}-\d{2}-\d{2}$/.test(newFileDate.value)) {
    alert('请输入有效日期格式 YYYY-MM-DD')
    return
  }
  // Create empty file
  const res = await $fetch<{ ok: boolean; error?: string }>(
    `/api/memory/short-term/${selectedAgentId.value}/${newFileDate.value}`,
    { method: 'PUT', body: { content: `# ${newFileDate.value}\n\n` } }
  )
  if (res.ok) {
    showNewFileDialog.value = false
    await loadShortTermFiles(selectedAgentId.value!)
    await loadAgents()
    await selectDate(newFileDate.value)
  }
}

const openNewFileDialog = () => {
  newFileDate.value = new Date().toISOString().slice(0, 10)
  showNewFileDialog.value = true
}

// ─── Long-term memory ────────────────────────────────────────────────────────
const loadLongTermChunks = async (agentId: string, offset = 0) => {
  loadingLong.value = true
  try {
    const params = new URLSearchParams({
      limit: String(longLimit),
      offset: String(offset),
    })
    if (longSearch.value) params.set('search', longSearch.value)

    const res = await $fetch<{ ok: boolean; result: { chunks: LongTermChunk[]; total: number } }>(
      `/api/memory/long-term/${agentId}?${params}`
    )
    if (res.ok) {
      longTermChunks.value = res.result.chunks
      longTermTotal.value = res.result.total
      longOffset.value = offset
    }
  } catch (e) {
    console.error(e)
  }
  loadingLong.value = false
}

const onLongSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (selectedAgentId.value) loadLongTermChunks(selectedAgentId.value, 0)
  }, 400)
}

const deleteChunk = async (chunk: LongTermChunk) => {
  if (!confirm('确定要删除这条长期记忆吗？此操作不可恢复。')) return
  try {
    const res = await $fetch<{ ok: boolean; error?: string }>(
      `/api/memory/long-term/${selectedAgentId.value}/${encodeURIComponent(chunk.id)}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      await loadLongTermChunks(selectedAgentId.value!, longOffset.value)
      await loadAgents()
    } else {
      alert('删除失败: ' + res.error)
    }
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

const longTotalPages = computed(() => Math.ceil(longTermTotal.value / longLimit))
const longCurrentPage = computed(() => Math.floor(longOffset.value / longLimit) + 1)

const goToPage = (page: number) => {
  if (!selectedAgentId.value) return
  const offset = (page - 1) * longLimit
  loadLongTermChunks(selectedAgentId.value, offset)
}

// ─── Core memory (MEMORY.md) ─────────────────────────────────────────────────
const loadCoreMemory = async (agentId: string) => {
  loadingCore.value = true
  try {
    const res = await $fetch<{ ok: boolean; result: { content: string; exists: boolean } }>(
      `/api/memory/long-term/${agentId}/core`
    )
    if (res.ok) coreContent.value = res.result.content
  } catch (e) {
    console.error(e)
  }
  loadingCore.value = false
  isCoreDirty.value = false
}

const saveCoreMemory = async () => {
  if (!selectedAgentId.value) return
  savingCore.value = true
  try {
    const res = await $fetch<{ ok: boolean; error?: string }>(
      `/api/memory/long-term/${selectedAgentId.value}/core`,
      { method: 'PUT', body: { content: coreContent.value } }
    )
    if (res.ok) {
      isCoreDirty.value = false
    } else {
      alert('保存失败: ' + res.error)
    }
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  }
  savingCore.value = false
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTs = (ts: number) => {
  return new Date(ts * 1000).toLocaleString('zh-CN')
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  return (bytes / 1024).toFixed(1) + ' KB'
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(loadAgents)
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">记忆管理</h1>
        <p class="text-gray-500 mt-1">管理 Agent 的短期记忆（每日日志）和长期记忆（向量知识库）</p>
      </div>
      <button
        @click="loadAgents"
        :disabled="loading"
        class="btn-secondary inline-flex items-center gap-2"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <!-- Main Layout -->
    <div class="flex gap-6 h-[calc(100vh-180px)]">

      <!-- Left: Agent List -->
      <div class="w-56 flex-shrink-0 flex flex-col gap-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">Agent</p>
        <button
          v-for="agent in agents"
          :key="agent.id"
          @click="selectAgent(agent.id)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border',
            selectedAgentId === agent.id
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700'
          ]"
        >
          <span class="text-2xl leading-none">{{ agent.emoji }}</span>
          <div class="min-w-0">
            <p class="font-medium text-sm truncate">{{ agent.identityName }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-gray-500 flex items-center gap-1">
                <CalendarDays class="w-3 h-3" />
                {{ agent.shortTermCount }}
              </span>
              <span class="text-xs text-gray-500 flex items-center gap-1">
                <Database class="w-3 h-3" />
                {{ agent.longTermCount }}
              </span>
            </div>
          </div>
        </button>

        <div v-if="loading && agents.length === 0" class="text-center py-8">
          <div class="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        </div>
      </div>

      <!-- Right: Memory Content -->
      <div v-if="selectedAgent" class="flex-1 flex flex-col min-w-0">
        <!-- Agent Header -->
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">{{ selectedAgent.emoji }}</span>
          <div>
            <h2 class="font-bold text-gray-900">{{ selectedAgent.identityName }}</h2>
            <p class="text-sm text-gray-500">@{{ selectedAgent.id }}</p>
          </div>
          <!-- Tabs -->
          <div class="ml-auto flex items-center bg-gray-100 rounded-lg p-1">
            <button
              @click="switchTab('short')"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === 'short' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              <CalendarDays class="w-4 h-4" />
              短期记忆
              <span class="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{{ selectedAgent.shortTermCount }}</span>
            </button>
            <button
              @click="switchTab('long')"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === 'long' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              <Database class="w-4 h-4" />
              长期记忆
              <span class="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{{ selectedAgent.longTermCount }}</span>
            </button>
          </div>
        </div>

        <!-- ── SHORT-TERM TAB ── -->
        <div v-if="activeTab === 'short'" class="flex gap-4 flex-1 min-h-0">
          <!-- File list -->
          <div class="w-48 flex-shrink-0 flex flex-col gap-1 overflow-y-auto">
            <!-- New file button -->
            <button
              @click="openNewFileDialog"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50 border border-dashed border-primary-200 mb-1 transition-colors"
            >
              <Plus class="w-4 h-4" />
              新建日志
            </button>

            <div v-if="loadingShort" class="py-4 text-center">
              <div class="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            </div>

            <div
              v-for="file in shortTermFiles"
              :key="file.date"
              :class="[
                'group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                selectedDate === file.date
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-gray-50 border border-transparent'
              ]"
              @click="selectDate(file.date)"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ file.date }}</p>
                <p class="text-xs text-gray-400">{{ formatSize(file.size) }}</p>
              </div>
              <button
                @click.stop="deleteFile(file.date)"
                class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all rounded"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>

            <div v-if="!loadingShort && shortTermFiles.length === 0" class="text-center py-6 text-sm text-gray-400">
              <CalendarDays class="w-6 h-6 mx-auto mb-2 text-gray-300" />
              暂无记忆文件
            </div>
          </div>

          <!-- File content editor -->
          <div class="flex-1 flex flex-col min-w-0">
            <div v-if="!selectedDate" class="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FileText class="w-12 h-12 mb-3 text-gray-300" />
              <p class="text-sm">选择左侧日志文件查看内容</p>
            </div>

            <template v-else>
              <!-- Editor toolbar -->
              <div class="flex items-center justify-between mb-3 flex-shrink-0">
                <div class="flex items-center gap-2">
                  <CalendarDays class="w-4 h-4 text-gray-400" />
                  <span class="font-medium text-gray-700">{{ selectedDate }}</span>
                  <span v-if="isDirty" class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">未保存</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="isDirty"
                    @click="isDirty = false; selectDate(selectedDate)"
                    class="btn-secondary text-sm inline-flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <X class="w-3.5 h-3.5" />
                    撤销
                  </button>
                  <button
                    @click="saveFile"
                    :disabled="saving || !isDirty"
                    class="btn-primary text-sm inline-flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50"
                  >
                    <Save class="w-3.5 h-3.5" :class="{ 'animate-pulse': saving }" />
                    {{ saving ? '保存中...' : '保存' }}
                  </button>
                </div>
              </div>

              <!-- Loading content -->
              <div v-if="loadingContent" class="flex-1 flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>

              <!-- Textarea editor -->
              <textarea
                v-else
                v-model="fileContent"
                @input="isDirty = true"
                class="flex-1 w-full font-mono text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent leading-relaxed"
                placeholder="记忆内容 (Markdown)"
                spellcheck="false"
              />
            </template>
          </div>
        </div>

        <!-- ── LONG-TERM TAB ── -->
        <div v-else class="flex-1 flex gap-4 min-h-0">

          <!-- Left: MEMORY.md 核心记忆编辑器 -->
          <div class="flex-1 flex flex-col min-w-0">
            <!-- Toolbar -->
            <div class="flex items-center justify-between mb-3 flex-shrink-0">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-gray-400" />
                <span class="font-medium text-gray-700 text-sm">MEMORY.md</span>
                <span class="text-xs text-gray-400">核心长期记忆</span>
                <span v-if="isCoreDirty" class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">未保存</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="isCoreDirty"
                  @click="loadCoreMemory(selectedAgentId!); isCoreDirty = false"
                  class="btn-secondary text-sm inline-flex items-center gap-1.5 px-3 py-1.5"
                >
                  <X class="w-3.5 h-3.5" />
                  撤销
                </button>
                <button
                  @click="saveCoreMemory"
                  :disabled="savingCore || !isCoreDirty"
                  class="btn-primary text-sm inline-flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50"
                >
                  <Save class="w-3.5 h-3.5" :class="{ 'animate-pulse': savingCore }" />
                  {{ savingCore ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="loadingCore" class="flex-1 flex items-center justify-center">
              <div class="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>

            <!-- Editor -->
            <textarea
              v-else
              v-model="coreContent"
              @input="isCoreDirty = true"
              class="flex-1 w-full font-mono text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent leading-relaxed"
              placeholder="在这里记录 Agent 的核心长期记忆（Markdown 格式）..."
              spellcheck="false"
            />
          </div>

          <!-- Right: 向量知识库 chunks -->
          <div class="w-80 flex-shrink-0 flex flex-col min-h-0">
            <!-- Header -->
            <div class="flex items-center justify-between mb-3 flex-shrink-0">
              <div class="flex items-center gap-2">
                <Database class="w-4 h-4 text-gray-400" />
                <span class="font-medium text-gray-700 text-sm">向量知识库</span>
                <span class="text-xs text-gray-400">{{ longTermTotal }} 条</span>
              </div>
            </div>

            <!-- Search -->
            <div class="relative mb-3 flex-shrink-0">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="longSearch"
                @input="onLongSearch"
                type="text"
                placeholder="搜索..."
                class="input pl-9 text-sm"
              />
            </div>

            <!-- No SQLite -->
            <div v-if="!selectedAgent.longTermExists" class="flex-1 flex flex-col items-center justify-center text-gray-400 text-center px-4">
              <Database class="w-8 h-8 mb-2 text-gray-300" />
              <p class="text-xs">还没有向量记忆库</p>
              <p class="text-xs text-gray-300 mt-1">运行 Agent 后自动创建</p>
            </div>

            <template v-else>
              <div v-if="loadingLong" class="flex-1 flex items-center justify-center">
                <div class="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>

              <div v-else class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto space-y-2">
                  <div
                    v-for="chunk in longTermChunks"
                    :key="chunk.id"
                    class="group bg-gray-50 border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span class="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded truncate max-w-[180px]">
                            {{ chunk.path.split('/').pop() }}
                          </span>
                          <span class="text-xs text-gray-400">
                            <Clock class="w-3 h-3 inline" />
                            {{ formatTs(chunk.updated_at) }}
                          </span>
                        </div>
                        <p class="text-xs text-gray-600 font-mono leading-relaxed line-clamp-3 whitespace-pre-wrap">{{ chunk.text }}</p>
                      </div>
                      <button
                        @click="deleteChunk(chunk)"
                        class="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all rounded"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div v-if="longTermChunks.length === 0" class="text-center py-8 text-gray-400">
                    <p class="text-xs">没有找到记忆内容</p>
                  </div>
                </div>

                <!-- Pagination -->
                <div v-if="longTotalPages > 1" class="flex items-center justify-center gap-2 mt-3 flex-shrink-0">
                  <button
                    @click="goToPage(longCurrentPage - 1)"
                    :disabled="longCurrentPage <= 1"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                  >上一页</button>
                  <span class="text-xs text-gray-500">{{ longCurrentPage }}/{{ longTotalPages }}</span>
                  <button
                    @click="goToPage(longCurrentPage + 1)"
                    :disabled="longCurrentPage >= longTotalPages"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                  >下一页</button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- No agent selected -->
      <div v-else class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <Brain class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p class="text-sm">选择一个 Agent 查看记忆</p>
        </div>
      </div>
    </div>

    <!-- New File Dialog -->
    <div
      v-if="showNewFileDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showNewFileDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-xl p-6 w-96">
        <h3 class="font-bold text-gray-900 mb-4">新建短期记忆日志</h3>
        <div class="mb-4">
          <label class="label">日期</label>
          <input
            v-model="newFileDate"
            type="date"
            class="input"
            @keyup.enter="createNewFile"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showNewFileDialog = false" class="btn-secondary">取消</button>
          <button @click="createNewFile" class="btn-primary">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>
