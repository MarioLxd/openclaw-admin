<script setup lang="ts">
import { 
  Search, Terminal, Book, RefreshCw, ChevronDown, ChevronRight,
  Settings, MessageSquare, Globe, Server, Bot, Clock, Shield,
  Key, Database, FolderOpen, Smartphone, Zap, HelpCircle
} from 'lucide-vue-next'

const searchQuery = ref('')
const expandedCategories = ref<Set<string>>(new Set(['core', 'channels', 'agents']))

// 命令分类数据
const commandCategories = [
  {
    id: 'core',
    name: '核心命令',
    icon: Terminal,
    description: 'OpenClaw 的基础操作命令',
    commands: [
      { name: 'openclaw configure', desc: '交互式配置向导，设置凭据、渠道、网关和代理默认值' },
      { name: 'openclaw setup', desc: '初始化本地配置和代理工作空间' },
      { name: 'openclaw status', desc: '显示渠道健康状态和最近的会话接收者' },
      { name: 'openclaw health', desc: '从运行中的网关获取健康状态' },
      { name: 'openclaw doctor', desc: '网关和渠道的健康检查和快速修复' },
      { name: 'openclaw --version', desc: '显示当前版本' },
      { name: 'openclaw --help', desc: '显示帮助信息' },
    ]
  },
  {
    id: 'gateway',
    name: '网关管理',
    icon: Server,
    description: 'WebSocket 网关的控制命令',
    commands: [
      { name: 'openclaw gateway start', desc: '启动网关服务' },
      { name: 'openclaw gateway stop', desc: '停止网关服务' },
      { name: 'openclaw gateway restart', desc: '重启网关服务' },
      { name: 'openclaw gateway status', desc: '查看网关运行状态' },
      { name: 'openclaw gateway --port 18789', desc: '指定端口启动网关' },
      { name: 'openclaw daemon', desc: '网关服务（传统别名）' },
      { name: 'openclaw tui', desc: '打开连接到网关的终端 UI' },
    ]
  },
  {
    id: 'channels',
    name: '渠道管理',
    icon: MessageSquare,
    description: '管理连接的聊天渠道（Telegram, Discord, WhatsApp 等）',
    commands: [
      { name: 'openclaw channels login', desc: '登录渠道（显示二维码进行连接）' },
      { name: 'openclaw channels logout', desc: '登出渠道' },
      { name: 'openclaw channels status', desc: '查看渠道连接状态' },
      { name: 'openclaw channels list', desc: '列出所有可用渠道' },
    ]
  },
  {
    id: 'agents',
    name: 'Agent 管理',
    icon: Bot,
    description: '管理独立的代理实例（工作空间、认证、路由）',
    commands: [
      { name: 'openclaw agents list', desc: '列出所有代理' },
      { name: 'openclaw agents create', desc: '创建新的代理' },
      { name: 'openclaw agents delete', desc: '删除代理' },
      { name: 'openclaw agent', desc: '通过网关运行一个代理轮次' },
    ]
  },
  {
    id: 'message',
    name: '消息操作',
    icon: MessageSquare,
    description: '发送、读取和管理消息',
    commands: [
      { name: 'openclaw message send', desc: '发送消息到指定目标' },
      { name: 'openclaw message read', desc: '读取消息' },
      { name: 'openclaw message list', desc: '列出消息' },
      { name: 'openclaw message react', desc: '添加/删除消息反应' },
    ]
  },
  {
    id: 'models',
    name: '模型管理',
    icon: Zap,
    description: '发现、扫描和配置 AI 模型',
    commands: [
      { name: 'openclaw models list', desc: '列出可用模型' },
      { name: 'openclaw models scan', desc: '扫描并发现新模型' },
      { name: 'openclaw models set-default', desc: '设置默认模型' },
    ]
  },
  {
    id: 'config',
    name: '配置管理',
    icon: Settings,
    description: '非交互式配置助手',
    commands: [
      { name: 'openclaw config get', desc: '获取配置值' },
      { name: 'openclaw config set', desc: '设置配置值' },
      { name: 'openclaw config unset', desc: '删除配置值' },
      { name: 'openclaw config path', desc: '显示配置文件路径' },
    ]
  },
  {
    id: 'cron',
    name: '定时任务',
    icon: Clock,
    description: '通过网关调度器管理定时任务',
    commands: [
      { name: 'openclaw cron list', desc: '列出所有定时任务' },
      { name: 'openclaw cron add', desc: '添加定时任务' },
      { name: 'openclaw cron remove', desc: '删除定时任务' },
    ]
  },
  {
    id: 'devices',
    name: '设备配对',
    icon: Smartphone,
    description: '设备配对和令牌管理',
    commands: [
      { name: 'openclaw devices list', desc: '列出已配对设备' },
      { name: 'openclaw devices pair', desc: '配对新设备' },
      { name: 'openclaw devices unpair', desc: '取消设备配对' },
      { name: 'openclaw qr', desc: '生成 iOS 配对二维码' },
    ]
  },
  {
    id: 'security',
    name: '安全工具',
    icon: Shield,
    description: '安全工具和本地配置审计',
    commands: [
      { name: 'openclaw security audit', desc: '运行安全审计' },
      { name: 'openclaw approvals list', desc: '列出执行审批' },
      { name: 'openclaw approvals clear', desc: '清除审批记录' },
    ]
  },
  {
    id: 'memory',
    name: '记忆管理',
    icon: Database,
    description: '搜索和索引记忆文件',
    commands: [
      { name: 'openclaw memory search', desc: '搜索记忆内容' },
      { name: 'openclaw memory reindex', desc: '重建记忆索引' },
    ]
  },
  {
    id: 'skills',
    name: '技能管理',
    icon: Book,
    description: '列出和检查可用技能',
    commands: [
      { name: 'openclaw skills list', desc: '列出所有技能' },
      { name: 'openclaw skills show', desc: '显示技能详情' },
      { name: 'openclaw skills install', desc: '安装新技能' },
    ]
  },
  {
    id: 'logs',
    name: '日志',
    icon: FolderOpen,
    description: '查看网关日志',
    commands: [
      { name: 'openclaw logs', desc: '通过 RPC 查看网关文件日志' },
    ]
  },
  {
    id: 'update',
    name: '更新',
    icon: RefreshCw,
    description: '更新 OpenClaw 和检查更新状态',
    commands: [
      { name: 'openclaw update', desc: '更新到最新版本' },
      { name: 'openclaw update check', desc: '检查是否有更新' },
    ]
  },
  {
    id: 'other',
    name: '其他命令',
    icon: HelpCircle,
    description: '其他实用命令',
    commands: [
      { name: 'openclaw docs', desc: '搜索实时 OpenClaw 文档' },
      { name: 'openclaw dashboard', desc: '打开控制 UI' },
      { name: 'openclaw sessions', desc: '列出存储的会话' },
      { name: 'openclaw reset', desc: '重置本地配置/状态' },
      { name: 'openclaw uninstall', desc: '卸载网关服务和本地数据' },
    ]
  },
]

// 过滤命令
const filteredCategories = computed(() => {
  if (!searchQuery.value) return commandCategories
  
  const query = searchQuery.value.toLowerCase()
  return commandCategories.map(cat => ({
    ...cat,
    commands: cat.commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query) || 
      cmd.desc.toLowerCase().includes(query)
    )
  })).filter(cat => cat.commands.length > 0)
})

// 切换分类展开/折叠
const toggleCategory = (id: string) => {
  if (expandedCategories.value.has(id)) {
    expandedCategories.value.delete(id)
  } else {
    expandedCategories.value.add(id)
  }
}

// 展开所有
const expandAll = () => {
  expandedCategories.value = new Set(commandCategories.map(c => c.id))
}

// 折叠所有
const collapseAll = () => {
  expandedCategories.value = new Set()
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">命令参考</h1>
        <p class="text-gray-500 mt-1">OpenClaw CLI 常用命令及说明</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="expandAll"
          class="btn-secondary text-sm inline-flex items-center gap-1"
        >
          <ChevronDown class="w-4 h-4" />
          全部展开
        </button>
        <button 
          @click="collapseAll"
          class="btn-secondary text-sm inline-flex items-center gap-1"
        >
          <ChevronRight class="w-4 h-4" />
          全部折叠
        </button>
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
          placeholder="搜索命令..."
          class="input pl-10"
        />
      </div>
    </div>

    <!-- Quick Reference Card -->
    <div class="mb-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
      <h3 class="font-semibold text-primary-900 mb-2">💡 快速提示</h3>
      <p class="text-sm text-primary-800">
        使用 <code class="bg-primary-100 px-1.5 py-0.5 rounded text-xs">openclaw &lt;command&gt; --help</code> 查看任何命令的详细帮助信息。
        例如：<code class="bg-primary-100 px-1.5 py-0.5 rounded text-xs">openclaw gateway --help</code>
      </p>
    </div>

    <!-- Command Categories -->
    <div class="space-y-4">
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="card overflow-hidden"
      >
        <!-- Category Header -->
        <button
          @click="toggleCategory(category.id)"
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <component 
              :is="category.icon" 
              class="w-5 h-5 text-primary-600"
            />
            <div class="text-left">
              <h3 class="font-semibold text-gray-900">{{ category.name }}</h3>
              <p class="text-sm text-gray-500">{{ category.description }}</p>
            </div>
          </div>
          <ChevronDown 
            v-if="expandedCategories.has(category.id)"
            class="w-5 h-5 text-gray-400"
          />
          <ChevronRight 
            v-else
            class="w-5 h-5 text-gray-400"
          />
        </button>

        <!-- Commands List -->
        <div 
          v-if="expandedCategories.has(category.id)"
          class="border-t border-gray-100"
        >
          <div 
            v-for="(cmd, index) in category.commands"
            :key="cmd.name"
            class="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
            :class="{ 'border-t border-gray-100': index > 0 }"
          >
            <code class="flex-shrink-0 bg-gray-900 text-green-400 px-3 py-1.5 rounded text-sm font-mono">
              {{ cmd.name }}
            </code>
            <p class="text-sm text-gray-600 pt-1.5">{{ cmd.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredCategories.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">没有找到命令</h3>
      <p class="text-gray-500">尝试调整搜索条件</p>
    </div>

    <!-- Footer -->
    <div class="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <Book class="w-4 h-4" />
          <span>更多详情请查看</span>
          <a 
            href="https://docs.openclaw.ai/cli" 
            target="_blank"
            class="text-primary-600 hover:text-primary-700 underline"
          >
            OpenClaw 官方文档
          </a>
        </div>
        <code class="text-xs bg-gray-200 px-2 py-1 rounded">openclaw docs</code>
      </div>
    </div>
  </div>
</template>
