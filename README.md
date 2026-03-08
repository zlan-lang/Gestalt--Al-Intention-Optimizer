# Gestalt Chrome Extension

Gestalt - AI Intent 编译器 Chrome 插件版本

## 功能特性

- 🎯 **智能提示词优化** - 将模糊需求转化为专业提示词
- 🧠 **多推理模式** - 支持直觉式、思维链(CoT)、思维树(ToT)
- 📝 **多任务类型** - 文本生成、图片生成、视频生成
- 🤖 **多平台支持** - 支持 Gemini、ChatGPT、Claude
- 🔄 **一键插入** - 优化后的提示词直接插入 AI 对话

## 安装方法

### 开发模式安装

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `chrome-extension` 文件夹

### 生成图标

插件需要 PNG 格式的图标文件。可以使用以下方式生成：

```bash
# 使用 Node.js 的 sharp 库
npm install sharp
node -e "
const sharp = require('sharp');
sharp('icons/icon.svg')
  .resize(16, 16)
  .png()
  .toFile('icons/icon16.png');
sharp('icons/icon.svg')
  .resize(48, 48)
  .png()
  .toFile('icons/icon48.png');
sharp('icons/icon.svg')
  .resize(128, 128)
  .png()
  .toFile('icons/icon128.png');
"
```

或者直接使用 SVG 图标（需要转换为 PNG）。

## 使用方法

1. 打开 AI 对话页面 (Gemini/ChatGPT/Claude)
2. 点击浏览器右上角的 Gestalt 插件图标
3. 在侧边栏中描述你的需求
4. 系统会自动优化提示词
5. 点击「插入」将优化后的提示词添加到对话

## 配置说明

1. 点击侧边栏中的设置图标
2. 配置 API Key（支持 ModelScope、DeepSeek、OpenAI、Ollama）
3. 选择默认的推理模式
4. 点击保存

## 文件结构

```
chrome-extension/
├── manifest.json       # 插件配置
├── background.js      # 后台脚本
├── content.js         # 内容脚本
├── content.css        # 注入样式
├── sidepanel.html    # 侧边栏
├── sidepanel.js      # 侧边栏逻辑
├── sidepanel.css     # 侧边栏样式
├── options.html      # 设置页面
├── options.js        # 设置逻辑
├── welcome.html      # 欢迎页面
├── icons/            # 图标
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 技术栈

- Manifest V3
- Vanilla JavaScript
- CSS3 (Flexbox, Grid)
- Chrome Side Panel API
- Chrome Storage API

## 注意事项

- API Key 仅保存在本地浏览器中
- 需要网络访问才能调用 AI API
- 支持的 AI：ModelScope、DeepSeek、OpenAI、Ollama
