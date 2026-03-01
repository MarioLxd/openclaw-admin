<script setup lang="ts">
import { Folder, FolderOpen, Plus, Trash2, RefreshCw, AlertCircle, Search, Puzzle, Box } from 'lucide-vue-next'

interface SkillInfo {
  id: string
  name: string
  description: string
  path: string
  source: 'extension' | 'extra-dir' | 'workspace'
  sourceLabel: string
}

const store = useOpenClawStore()

onMounted(() => {
  if (!store.config) {
    store.loadConfig()
  }
  loadSkills()
})

// ==================== Skills 目录配置 ====================

const isSaving = ref(false)
const saveMessage = ref('')
const newDir = ref('')

const extraDirs = computed({
  get: () => store.skillsConfig?.load?.extraDirs || [],
  set: () => {},
})

const addDirectory = async () => {
  if (!newDir.value.trim() || !store.config) return
  const newDirs = [...extraDirs.value, newDir.value.trim()]
  await saveSkillsConfig(newDirs)
  newDir.value = ''
}

const removeDirectory = async (index: number) => {
  if (!store.config) return
  const newDirs = extraDirs.value.filter((_, i) => i !== index)
  await saveSkillsConfig(newDirs)
}

const saveSkillsConfig = async (dirs: string[]) => {
  isSaving.value = true
  saveMessage.value = ''

  const result = await store.saveConfigPatch({
    skills: { load: { extraDirs: dirs } },
  })

  if (result) {
    saveMessage.value = '配置已保存'
    setTimeout(() => saveMessage.value = '', 3000)
    await loadSkills()
  } else {
    saveMessage.value = '保存失败: ' + store.error
  }

  isSaving.value = false
  return result
}

// ==================== 已加载 Skills 列表 ====================

const skills = ref<SkillInfo[]>([])
const loadingSkills = ref(false)
const skillsError = ref('')
const searchQuery = ref('')

const loadSkills = async () => {
  loadingSkills.value = true
  skillsError.value = ''
  try {
    const response = await $fetch<{ ok: boolean; result?: SkillInfo[]; error?: string }>('/api/skills')
    if (response.ok && response.result) {
      skills.value = response.result
    } else {
      skillsError.value = response.error || '加载失败'
    }
  } catch (e: any) {
    skillsError.value = e.message || '请求失败'
  }
  loadingSkills.value = false
}

const filteredSkills = computed(() => {
  if (!searchQuery.value) return skills.value
  const q = searchQuery.value.toLowerCase()
  return skills.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q),
  )
})

const sourceLabels: Record<string, string> = {
  'extension': '扩展',
  'extra-dir': '额外目录',
  'workspace': 'Workspace',
}

const sourceBadgeClass: Record<string, string> = {
  'extension': 'bg-purple-100 text-purple-800',
  'extra-dir': 'bg-blue-100 text-blue-800',
  'workspace': 'bg-orange-100 text-orange-800',
}

const refreshAll = async () => {
  await store.loadConfig()
  await loadSkills()
}

const openSkillFolder = (path: string) => {
  $fetch('/api/utils/open-folder', {
    method: 'POST',
    body: { path },
  }).catch(() => {
    alert(`Skill 路径: ${path}`)
  })
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Skills 配置</h1>
        <p class="text-gray-500 mt-1">管理 Skills 加载路径，查看已加载的 Skills</p>
      </div>
      <button
        @click="refreshAll"
        :disabled="store.loading || loadingSkills"
        class="btn-secondary inline-flex items-center gap-2"
      >
        <RefreshCw
          class="w-4 h-4"
          :class="{ 'animate-spin': store.loading || loadingSkills }"
        />
        刷新
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="store.error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-500" />
      <div>
        <p class="font-medium text-red-900">配置加载失败</p>
        <p class="text-sm text-red-700">{{ store.error }}</p>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Extra Directories 配置 -->
      <div class="card p-6 max-w-3xl">
        <div class="flex items-center gap-2 mb-2">
          <Folder class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900">额外 Skills 目录</h2>
        </div>
        <p class="text-sm text-gray-500 mb-4">
          配置额外的 Skills 加载路径，可以是单个 Skill 目录，也可以是包含多个 Skill 的父目录。支持 <code class="bg-gray-100 px-1 rounded">~</code> 作为用户主目录。
        </p>

        <!-- Current Directories -->
        <div class="space-y-2 mb-4">
          <div v-if="extraDirs.length === 0" class="text-sm text-gray-400 py-2">
            暂无额外目录配置
          </div>
          <div
            v-for="(dir, index) in extraDirs"
            :key="index"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-3 min-w-0">
              <Folder class="w-4 h-4 text-gray-400 shrink-0" />
              <code class="text-sm text-gray-700 truncate">{{ dir }}</code>
            </div>
            <button
              @click="removeDirectory(index)"
              :disabled="isSaving"
              class="p-1.5 hover:bg-red-100 rounded-lg transition-colors shrink-0 ml-2"
            >
              <Trash2 class="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        <!-- Add Directory -->
        <div class="flex gap-2">
          <input
            v-model="newDir"
            type="text"
            class="input flex-1"
            placeholder="例如: ~/my-skills 或 ~/my-skills/specific-skill"
            @keyup.enter="addDirectory"
          />
          <button
            @click="addDirectory"
            :disabled="!newDir.trim() || isSaving"
            class="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Plus class="w-4 h-4" />
            添加
          </button>
        </div>

        <p v-if="saveMessage" :class="['mt-3 text-sm', saveMessage.includes('失败') ? 'text-red-600' : 'text-green-600']">
          {{ saveMessage }}
        </p>
      </div>

      <!-- 已加载 Skills 列表 -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Puzzle class="w-5 h-5 text-primary-600" />
            <h2 class="text-lg font-semibold text-gray-900">
              已加载 Skills
              <span v-if="skills.length" class="ml-2 text-sm font-normal text-gray-400">{{ skills.length }} 个</span>
            </h2>
          </div>
          <div class="relative w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索 Skills..."
              class="input pl-9 py-2 text-sm"
            />
          </div>
        </div>

        <!-- Skills Error -->
        <div v-if="skillsError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle class="w-5 h-5 text-red-500" />
          <p class="text-sm text-red-700">{{ skillsError }}</p>
        </div>

        <!-- Loading -->
        <div v-if="loadingSkills" class="text-center py-8">
          <div class="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
          <p class="text-sm text-gray-500">扫描 Skills 目录...</p>
        </div>

        <!-- Skills Grid -->
        <div v-else-if="filteredSkills.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="skill in filteredSkills"
            :key="skill.path"
            class="card p-5 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2 min-w-0">
                <Box class="w-5 h-5 text-primary-500 shrink-0" />
                <div class="min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">{{ skill.name }}</h3>
                  <p v-if="skill.name !== skill.id" class="text-xs text-gray-400 truncate">{{ skill.id }}</p>
                </div>
              </div>
              <button
                @click="openSkillFolder(skill.path)"
                class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
                title="打开目录"
              >
                <FolderOpen class="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <p class="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[2.5rem]">
              {{ skill.description || '暂无描述' }}
            </p>

            <div class="flex items-center justify-between">
              <span
                :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', sourceBadgeClass[skill.source] || 'bg-gray-100 text-gray-700']"
              >
                {{ sourceLabels[skill.source] || skill.source }}
                <span class="ml-1 opacity-70">· {{ skill.sourceLabel }}</span>
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                已加载
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loadingSkills" class="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Puzzle class="w-7 h-7 text-gray-400" />
          </div>
          <h3 class="text-base font-medium text-gray-900 mb-1">
            {{ searchQuery ? '没有匹配的 Skill' : '暂无 Skills' }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ searchQuery ? '尝试调整搜索关键词' : '在上方添加 Skills 目录后，Skill 将自动出现在这里' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
