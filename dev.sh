#!/bin/bash

# 设置文件描述符限制（macOS）
ulimit -n 65536
ulimit -u 2048

# 加载环境变量
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Starting OpenClaw Admin..."
echo "Gateway URL: $OPENCLAW_GATEWAY_URL"
echo ""

# 启动开发服务器
pnpm run dev
