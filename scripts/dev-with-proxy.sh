#!/bin/bash

# 设置代理环境变量
export HTTP_PROXY=http://localhost:7890
export HTTPS_PROXY=http://localhost:7890
export NO_PROXY=localhost,127.0.0.1

echo "Starting micro-user with proxy settings:"
echo "HTTP_PROXY=$HTTP_PROXY"
echo "HTTPS_PROXY=$HTTPS_PROXY"

# 启动开发服务器
npm run dev