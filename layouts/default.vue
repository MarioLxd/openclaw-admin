<script setup lang="ts">
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Brain,
  Settings,
  Puzzle,
  Link,
  Server,
  RefreshCw,
  Terminal,
  Clock,
  BookOpen,
} from 'lucide-vue-next'

const route = useRoute()

const navigation = [
  { name: '仪表盘', href: '/', icon: LayoutDashboard },
  { name: 'Agent 管理', href: '/agents', icon: Bot },
  { name: '记忆管理', href: '/memory', icon: BookOpen },
  { name: '模型配置', href: '/models', icon: Brain },
  { name: '渠道配置', href: '/channels', icon: MessageSquare },
  { name: '绑定管理', href: '/bindings', icon: Link },
  { name: 'Gateway 配置', href: '/gateway', icon: Server },
  { name: '定时任务', href: '/cron', icon: Clock },
  { name: 'Skills 配置', href: '/skills', icon: Puzzle },
  { name: '命令参考', href: '/commands', icon: Terminal },
  { name: '版本检查', href: '/settings/version', icon: RefreshCw },
  { name: '系统设置', href: '/settings', icon: Settings },
]

const isActive = (href: string) => {
  if (href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(href)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <span class="text-white font-bold text-lg">O</span>
        </div>
        <div>
          <h1 class="font-bold text-gray-900">OpenClaw</h1>
          <p class="text-xs text-gray-500">配置管理中心</p>
        </div>
      </div>

      <nav class="p-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
            isActive(item.href)
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.name }}
        </NuxtLink>
      </nav>

      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span class="text-gray-600 text-sm font-medium">A</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">Admin</p>
            <p class="text-xs text-gray-500 truncate">管理员</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="ml-64 min-h-screen">
      <slot />
    </main>
  </div>
</template>
