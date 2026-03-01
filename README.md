# OpenClaw Admin

基于 Vue 3 + Nuxt 3 + Tailwind CSS 的 OpenClaw 配置管理后台。

## 功能特性

- 📊 **仪表盘** - 系统概览和状态监控
- 🤖 **Agent 管理** - 创建、编辑、删除 Agent 配置
- 🧠 **模型配置** - 管理 AI 模型提供商和模型
- 💬 **渠道配置** - 配置消息渠道（飞书等）
- 🔗 **绑定管理** - 管理 Agent 与渠道的绑定关系
- ⚙️ **Gateway 配置** - 网关服务和网络设置
- 🧩 **Skills 配置** - 管理 Skills 加载路径
- 🔧 **系统设置** - 其他系统配置选项

## 技术栈

- **框架**: Vue 3 + Nuxt 3
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide Vue Next

## 快速开始

### 安装依赖

```bash
cd openclaw-admin
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
openclaw-admin/
├── assets/css/
│   └── main.css          # 全局样式和 Tailwind 导入
├── components/           # 组件目录
├── layouts/
│   └── default.vue       # 默认布局（侧边栏导航）
├── pages/                # 页面路由
│   ├── index.vue         # 仪表盘
│   ├── agents/
│   │   ├── index.vue     # Agent 列表
│   │   └── new.vue       # 新建 Agent
│   ├── models/
│   │   └── index.vue     # 模型配置
│   ├── channels/
│   │   └── index.vue     # 渠道配置
│   ├── bindings/
│   │   └── index.vue     # 绑定管理
│   ├── gateway/
│   │   └── index.vue     # Gateway 配置
│   ├── skills/
│   │   └── index.vue     # Skills 配置
│   └── settings/
│       └── index.vue     # 系统设置
├── app.vue               # 应用入口
├── nuxt.config.ts        # Nuxt 配置
├── tailwind.config.js    # Tailwind 配置
└── package.json
```

## 配置说明

### OpenClaw 配置结构

后台管理涵盖以下 OpenClaw 配置模块：

1. **agents** - Agent 配置列表
   - 每个 Agent 包含 ID、名称、工作目录、模型、身份配置等

2. **models** - AI 模型配置
   - 模型提供商（Moonshot、MiniMax、智谱 AI 等）
   - 模型参数（上下文窗口、最大 Tokens、推理支持等）

3. **channels** - 消息渠道配置
   - 渠道启用状态
   - 账号配置（App ID、App Secret 等）
   - 媒体文件根目录

4. **bindings** - Agent 与渠道的绑定关系
   - 定义哪个 Agent 处理哪个渠道的哪个账号

5. **gateway** - 网关服务配置
   - 端口、运行模式、认证方式
   - Tailscale 配置
   - 节点命令限制

6. **skills** - Skills 加载配置
   - 额外的 Skills 目录路径

7. **其他配置** - 消息、命令、插件等设置

## 开发计划

- [ ] 接入 OpenClaw Gateway API 实现实时数据
- [ ] 配置版本历史和回滚功能
- [ ] 配置验证和错误提示
- [ ] 深色模式支持
- [ ] 响应式移动端适配

## License

MIT
