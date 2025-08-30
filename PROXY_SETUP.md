# 代理配置说明

## 开发环境代理设置

如果你在开发环境中需要使用代理来访问 Google Gemini API，请按照以下步骤配置：

### 方法 1: 使用环境变量

在 `.env` 文件中设置代理：

```bash
# 开发环境代理配置
HTTP_PROXY="http://localhost:7890"
HTTPS_PROXY="http://localhost:7890"
```

### 方法 2: 使用代理启动脚本

运行带代理的开发服务器：

```bash
npm run dev:proxy
```

### 方法 3: 手动设置环境变量

在终端中设置环境变量后启动：

```bash
export HTTP_PROXY=http://localhost:7890
export HTTPS_PROXY=http://localhost:7890
npm run dev
```

## 常见代理端口

- **Clash**: 7890
- **V2Ray**: 1080
- **Shadowsocks**: 1080
- **其他**: 根据你的代理软件设置

## 验证代理设置

启动服务器后，在控制台中应该能看到：

```
Using HTTPS proxy: http://localhost:7890
```

## 故障排除

1. **确保代理软件正在运行**
2. **检查代理端口是否正确**
3. **确认代理软件允许本地连接**
4. **检查防火墙设置**

## 网络错误处理

现在系统会自动检测网络错误并立即停止重试，避免无限轮询：

- 连接超时错误会立即失败
- 网络连接错误不会重试
- 错误消息会提示检查网络连接或代理设置