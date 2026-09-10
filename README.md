# Model API Lab · U 盘精简版

一个用于课堂教学的大模型 API 学习工具。学生可以填写自己的 Base URL、模型名和 API Key，直观学习 API 连接、提示词、生成参数、多轮对话、Mermaid 思维导图、图像、语音和视频生成。

本仓库只包含可直接运行的 **Windows U 盘精简版**，不包含开发环境和 `node_modules`。程序已经内置 Windows x64 Node.js 运行时，无需另外安装 Node.js。

## 主要功能

- 使用通用 OpenAI 兼容格式，可连接不同模型供应商
- 内置 DeepSeek、硅基流动快捷配置
- 普通多轮对话，可调整 Temperature、Top P 和 Max Tokens
- 对话式生成 Mermaid 思维导图，并支持本地修改代码后重新渲染
- 图像生成与参考图片上传
- 单轮文本生成语音，支持音色、格式、采样率、语速和增益参数
- 单轮语音转文字，支持上传不超过 50 MB、最长 1 小时的音频文件
- 单轮视频生成，支持首帧图片、尺寸、反向提示词和随机种子，并演示异步任务轮询
- 展示实际请求体、完整输入和服务商完整返回内容
- API Key 只保存在当前页面内存，不写入浏览器存储或本地文件
- 可清空当前页面中的密钥

## 使用方法

1. 下载并解压整个仓库，或完整复制到 U 盘。
2. 在 64 位 Windows 10 或 Windows 11 上双击 `打开模型API课堂.cmd`。
3. 浏览器会自动打开 `http://127.0.0.1:8188/`。
4. 选择 API 格式，填写 Base URL、模型名和自己的 API Key。
5. 点击“应用配置”，然后使用多轮对话、思维导图、图像、语音或视频生成功能。

请勿单独移动启动文件。`dist`、`runtime`、`scripts`、`server.mjs`、`package.json` 和启动文件需要保持原有目录结构。

## 常用配置示例

### DeepSeek

- API 格式：`openai`
- Base URL：`https://api.deepseek.com`
- 模型名：填写账户实际支持的 model ID

### 硅基流动

- API 格式：`openai`
- Base URL：`https://api.siliconflow.cn/v1`
- 模型名：填写硅基流动提供的 model ID

语音与视频页面不会自动填入模型名，目的是让学生练习从服务商文档中查找并填写正确的 model ID。文字转语音调用 `/audio/speech`，语音转文字调用 `/audio/transcriptions`；视频先调用 `/video/submit`，再轮询 `/video/status`。

## 端口

默认从 `8188` 端口启动。如果端口已被占用，启动器会继续尝试后续端口。也可以在启动前通过环境变量 `MODEL_API_LAB_START_PORT` 指定起始端口。

## 密钥与网络安全

- 工具不会把 API Key 写入磁盘、数据库或浏览器长期存储。
- 点击“清空密钥”只会清除当前页面中的内容，不会撤销供应商平台上的 Key。
- 如需让其他电脑访问，请优先使用 HTTPS。通过公网 HTTP 地址提交 Key 时，传输内容没有加密。
- 课堂临时使用时，建议创建低额度临时 Key，并在课程结束后到模型供应商后台撤销。

## 运行环境

- 64 位 Windows 10 / Windows 11
- 可访问所选模型供应商 API 的网络
- 现代浏览器（Edge、Chrome 等）

## 目录说明

```text
dist/                    已构建的网站文件
runtime/node.exe         内置 Node.js 运行时
scripts/start-lab.ps1    本地启动脚本
server.mjs               精简版本地服务器
打开模型API课堂.cmd      双击启动入口
```

## 说明

该工具用于 API 教学实验。模型输出可能不准确，实际费用、限额、模型名称和参数支持情况以各模型供应商为准。
