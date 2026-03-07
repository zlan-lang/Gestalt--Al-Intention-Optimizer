// ==========================================
// Gestalt Side Panel - 完整重构版本 v2.1.0
// 集成 RAG 系统·智能推理·多模态支持
// ==========================================

// 导入核心库（通过 script 标签在 HTML 中引入）
// lib/types.js - 类型定义
// lib/rag-core.js - RAG 核心系统
// lib/prompts.js - 提示词策略

// 全局配置
const CONFIG = {
  modes: ['text', 'image', 'video', 'audio'],  // 添加音频模式
  storageKeys: {
    text: 'gestalt_text_state',
    image: 'gestalt_image_state',
    video: 'gestalt_video_state',
    audio: 'gestalt_audio_state',  // 添加音频状态
    prompts: 'gestaltPrompts',
    history: 'gestaltHistory',
    config: 'gestaltConfig'
  }
}

// 每个模式的独立状态
const modeStates = {
  text: {
    messages: [],
    extractedPrompt: '',
    isLoading: false,
    lastReasoningMode: null,
    lastInput: ''
  },
  image: {
    messages: [],
    extractedPrompt: '',
    isLoading: false,
    lastReasoningMode: null,
    lastInput: ''
  },
  video: {
    messages: [],
    extractedPrompt: '',
    isLoading: false,
    lastReasoningMode: null,
    lastInput: ''
  },
  audio: {
    messages: [],
    extractedPrompt: '',
    isLoading: false,
    lastReasoningMode: null,
    lastInput: ''
  }
}

// 共享状态
let currentMode = 'text'
let config = null
let prompts = []
let history = []
let currentTags = []
let editingPromptId = null
let contextEnabled = true  // 记忆功能默认开启

// DOM 元素缓存
const elements = {}

// ==========================================
// 初始化
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Gestalt] 初始化 v2.1.0 - RAG增强版')

  cacheElements()
  await loadConfig()
  await loadModeStates()
  await loadPrompts()
  await loadHistory()

  bindEvents()
  bindQuickPrompts()

  renderPrompts()
})

// 缓存DOM元素
function cacheElements() {
  // 面板
  elements.textPanel = document.getElementById('textPanel')
  elements.imagePanel = document.getElementById('imagePanel')
  elements.videoPanel = document.getElementById('videoPanel')
  elements.audioPanel = document.getElementById('audioPanel')  // 音频面板
  elements.libraryPanel = document.getElementById('libraryPanel')
  elements.historyPanel = document.getElementById('historyPanel')

  // 文本模式元素
  elements.textMessages = document.getElementById('textMessages')
  elements.textInput = document.getElementById('textInput')
  elements.textSendBtn = document.getElementById('textSendBtn')
  elements.textOutput = document.getElementById('textOutput')
  elements.textExtractedPrompt = document.getElementById('textExtractedPrompt')

  // 图片模式元素
  elements.imageMessages = document.getElementById('imageMessages')
  elements.imageInput = document.getElementById('imageInput')
  elements.imageSendBtn = document.getElementById('imageSendBtn')
  elements.imageOutput = document.getElementById('imageOutput')
  elements.imageExtractedPrompt = document.getElementById('imageExtractedPrompt')

  // 视频模式元素
  elements.videoMessages = document.getElementById('videoMessages')
  elements.videoInput = document.getElementById('videoInput')
  elements.videoSendBtn = document.getElementById('videoSendBtn')
  elements.videoOutput = document.getElementById('videoOutput')
  elements.videoExtractedPrompt = document.getElementById('videoExtractedPrompt')

  // 音频模式元素
  elements.audioMessages = document.getElementById('audioMessages')
  elements.audioInput = document.getElementById('audioInput')
  elements.audioSendBtn = document.getElementById('audioSendBtn')
  elements.audioOutput = document.getElementById('audioOutput')
  elements.audioExtractedPrompt = document.getElementById('audioExtractedPrompt')

  // 库和设置
  elements.libraryList = document.getElementById('libraryList')
  elements.librarySearch = document.getElementById('librarySearch')
  elements.historyList = document.getElementById('historyList')

  // 头部按钮
  elements.libraryBtn = document.getElementById('libraryBtn')
  elements.historyBtn = document.getElementById('historyBtn')
  elements.settingsBtn = document.getElementById('settingsBtn')

  // 设置弹窗
  elements.settingsModal = document.getElementById('settingsModal')
  elements.apiKeyInput = document.getElementById('apiKey')
  elements.baseUrlSelect = document.getElementById('baseUrl')
  elements.modelNameInput = document.getElementById('modelName')
  elements.saveConfigBtn = document.getElementById('saveConfig')
  elements.closeSettingsBtn = document.getElementById('closeSettings')

  // 历史面板
  elements.closeHistoryBtn = document.getElementById('closeHistoryBtn')
  elements.clearHistoryBtn = document.getElementById('clearHistoryBtn')

  // 提示词编辑弹窗
  elements.promptModal = document.getElementById('promptModal')
  elements.closePromptModalBtn = document.getElementById('closePromptModal')
}

// ==========================================
// 配置管理
// ==========================================

async function loadConfig() {
  const result = await chrome.storage.local.get(['gestaltConfig'])
  config = result.gestaltConfig || {
    apiKey: 'sk-aaceedc5897743158c4b099dc08b24c5',
    baseUrl: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat'
  }

  // 更新UI
  if (elements.apiKeyInput) elements.apiKeyInput.value = config.apiKey
  if (elements.baseUrlSelect) elements.baseUrlSelect.value = config.baseUrl
  if (elements.modelNameInput) elements.modelNameInput.value = config.modelName
}

async function saveConfig(newConfig) {
  config = { ...config, ...newConfig }
  await chrome.storage.local.set({ gestaltConfig: config })
  showToast('配置已保存', 'success')
}

// ==========================================
// 模式状态管理
// ==========================================

async function loadModeStates() {
  for (const mode of CONFIG.modes) {
    const result = await chrome.storage.local.get([CONFIG.storageKeys[mode]])
    if (result[CONFIG.storageKeys[mode]]) {
      modeStates[mode] = {
        ...modeStates[mode],
        ...result[CONFIG.storageKeys[mode]]
      }
    }
  }
}

function saveCurrentModeState() {
  const state = {
    messages: modeStates[currentMode].messages,
    extractedPrompt: modeStates[currentMode].extractedPrompt,
    lastInput: modeStates[currentMode].lastInput,
    lastReasoningMode: modeStates[currentMode].lastReasoningMode
  }
  chrome.storage.local.set({
    [CONFIG.storageKeys[currentMode]]: state
  })
}

// ==========================================
// 事件绑定
// ==========================================

function bindEvents() {
  // 模式切换
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode
      if (mode && mode !== 'contextToggle') {
        switchMode(mode)
      }
    })
  })

  // 头部按钮
  elements.libraryBtn?.addEventListener('click', toggleLibrary)
  elements.historyBtn?.addEventListener('click', toggleHistory)
  elements.settingsBtn?.addEventListener('click', openSettings)

  // 提示词库关闭按钮
  const closeLibraryBtn = document.getElementById('closeLibraryBtn')
  if (closeLibraryBtn) {
    closeLibraryBtn.addEventListener('click', toggleLibrary)
  }

  // 设置弹窗
  elements.closeSettingsBtn?.addEventListener('click', closeSettings)
  elements.saveConfigBtn?.addEventListener('click', handleSaveConfig)

  // 提示词弹窗
  const closePromptModalBtn = document.getElementById('closePromptModal')
  const cancelPromptBtn = document.getElementById('cancelPromptBtn')
  const savePromptModalBtn = document.getElementById('savePromptModalBtn')

  closePromptModalBtn?.addEventListener('click', () => {
    const modal = document.getElementById('promptModal')
    if (modal) {
      modal.style.display = 'none'
      delete modal.dataset.editingId
    }
  })

  cancelPromptBtn?.addEventListener('click', () => {
    const modal = document.getElementById('promptModal')
    if (modal) {
      modal.style.display = 'none'
      delete modal.dataset.editingId
    }
  })

  savePromptModalBtn?.addEventListener('click', async () => {
    const modal = document.getElementById('promptModal')
    if (!modal) return

    const title = document.getElementById('promptTitle').value.trim()
    const content = document.getElementById('promptContent').value.trim()
    const description = document.getElementById('promptDescription').value.trim()

    if (!content) {
      showToast('内容不能为空', 'warning')
      return
    }

    // 检查是新建还是编辑
    const editingId = modal.dataset.editingId

    if (editingId) {
      // 编辑现有提示词
      const prompt = prompts.find(p => p.id === editingId)
      if (prompt) {
        prompt.title = title
        prompt.content = content
        prompt.description = description
        prompt.updatedAt = Date.now()
      }

      showToast('已更新提示词', 'success')
    } else {
      // 新建提示词
      const newPrompt = {
        id: Date.now().toString(),
        title: title || content.substring(0, 30) + (content.length > 30 ? '...' : ''),
        content: content,
        description: description || '自定义提示词',
        tags: [currentMode],
        mode: currentMode,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      prompts.push(newPrompt)
      showToast('已保存提示词', 'success')
    }

    await chrome.storage.local.set({ gestaltPrompts: prompts })
    renderPrompts()

    // 关闭弹窗
    modal.style.display = 'none'
    delete modal.dataset.editingId
  })

  // 新建提示词按钮
  const newPromptBtn = document.getElementById('newPromptBtn')
  if (newPromptBtn) {
    newPromptBtn.addEventListener('click', () => {
      const modal = document.getElementById('promptModal')
      if (!modal) return

      // 清空表单
      document.getElementById('promptTitle').value = ''
      document.getElementById('promptContent').value = ''
      document.getElementById('promptDescription').value = ''

      // 清除编辑状态
      delete modal.dataset.editingId

      // 设置标题
      document.getElementById('promptModalTitle').textContent = '📝 新建提示词'

      // 显示弹窗
      modal.style.display = 'flex'
    })
  }

  // 历史面板
  elements.closeHistoryBtn?.addEventListener('click', closeHistory)
  elements.clearHistoryBtn?.addEventListener('click', clearHistory)

  // 发送按钮（为所有模式绑定）
  for (const mode of CONFIG.modes) {
    const sendBtn = document.getElementById(`${mode}SendBtn`)
    if (sendBtn) {
      sendBtn.addEventListener('click', () => handleSend(mode))
    }

    const input = document.getElementById(`${mode}Input`)
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          handleSend(mode)
        }
      })
    }
  }

  // 输出区域操作按钮
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action || btn.classList.contains('copyBtn') ? 'copy' :
                      btn.classList.contains('saveToLibraryBtn') ? 'save' :
                      btn.classList.contains('insertBtn') ? 'insert' : null

      const mode = btn.dataset.mode || currentMode

      if (action === 'copy') handleCopy(mode)
      else if (action === 'save') handleSaveToLibrary(mode)
      else if (action === 'insert') handleInsert(mode)
    })
  })

  // 库搜索
  elements.librarySearch?.addEventListener('input', (e) => {
    filterPrompts(e.target.value)
  })

  // 导出导出按钮
  const exportBtn = document.getElementById('exportBtn')
  const importBtn = document.getElementById('importBtn')

  exportBtn?.addEventListener('click', handleExport)
  importBtn?.addEventListener('click', handleImport)

  // ==========================================
  // 事件委托 - 处理动态创建的按钮
  // ==========================================

  // 使用事件委托处理所有动态按钮点击
  document.addEventListener('click', (e) => {
    const target = e.target
    const button = target.closest('button')

    if (!button) return

    const action = button.dataset.action
    if (!action) return

    e.preventDefault()
    e.stopPropagation()

    console.log('[Gestalt] 事件委托捕获到点击:', action, button.dataset)

    switch (action) {
      // 消息编辑相关
      case 'edit-message':
        const mode = button.dataset.mode
        const messageId = button.dataset.messageId
        if (mode && messageId) {
          console.log('[Gestalt] 调用 startEditMessage:', mode, messageId)
          window.startEditMessage(mode, messageId)
        }
        break

      case 'cancel-edit':
        const cancelMode = button.dataset.mode
        const cancelMessageId = button.dataset.messageId
        if (cancelMode && cancelMessageId) {
          console.log('[Gestalt] 调用 cancelEditMessage:', cancelMode, cancelMessageId)
          window.cancelEditMessage(cancelMode, cancelMessageId)
        }
        break

      case 'confirm-edit':
        const confirmMode = button.dataset.mode
        const confirmMessageId = button.dataset.messageId
        if (confirmMode && confirmMessageId) {
          console.log('[Gestalt] 调用 confirmEditMessage:', confirmMode, confirmMessageId)
          window.confirmEditMessage(confirmMode, confirmMessageId)
        }
        break

      // 提示词库相关
      case 'use-prompt':
        const promptId = button.dataset.promptId
        if (promptId) {
          console.log('[Gestalt] 调用 usePrompt:', promptId)
          window.usePrompt(promptId)
        }
        break

      case 'edit-prompt':
        const editPromptId = button.dataset.promptId
        if (editPromptId) {
          console.log('[Gestalt] 调用 editLibraryPrompt:', editPromptId)
          window.editLibraryPrompt(editPromptId)
        }
        break

      case 'delete-prompt':
        const deletePromptId = button.dataset.promptId
        if (deletePromptId) {
          console.log('[Gestalt] 调用 deletePrompt:', deletePromptId)
          window.deletePrompt(deletePromptId)
        }
        break

      // 历史记录相关
      case 'reuse-history':
        const historyId = button.dataset.historyId
        if (historyId) {
          console.log('[Gestalt] 调用 reuseHistory:', historyId)
          window.reuseHistory(historyId)
        }
        break

      case 'delete-history':
        const deleteHistoryId = button.dataset.historyId
        if (deleteHistoryId) {
          console.log('[Gestalt] 调用 deleteHistoryItem:', deleteHistoryId)
          window.deleteHistoryItem(deleteHistoryId)
        }
        break
    }
  }, true) // 使用捕获阶段以确保优先处理
}

function bindQuickPrompts() {
  // 快速提示词按钮
  document.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt
      if (prompt) {
        const input = document.getElementById(`${currentMode}Input`)
        if (input) {
          input.value = prompt
          input.focus()
        }
      }
    })
  })
}

// ==========================================
// 模式切换
// ==========================================

function switchMode(mode) {
  if (mode === currentMode) return

  console.log('[Gestalt] 切换模式:', currentMode, '→', mode)

  // 保存当前模式状态
  saveCurrentModeState()

  // 切换
  currentMode = mode

  // 更新标签样式
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode)
  })

  // 隐藏库面板
  if (elements.libraryPanel) {
    elements.libraryPanel.style.display = 'none'
  }
  elements.libraryBtn?.classList.remove('active')

  // 切换面板显示
  document.querySelectorAll('.mode-chat-panel').forEach(panel => {
    if (panel.dataset.mode === mode) {
      panel.style.display = 'flex'
    } else {
      panel.style.display = 'none'
    }
  })

  // 渲染当前模式的消息
  renderCurrentModeMessages()

  // 显示Toast提示
  const modeNames = {
    text: '📝 文本',
    image: '🎨 图片',
    video: '🎬 视频',
    audio: '🎵 音频'
  }
  showToast(`已切换到 ${modeNames[mode]}`, 'info')

  // 聚焦到当前模式的输入框
  setTimeout(() => {
    const input = document.getElementById(`${mode}Input`)
    if (input) {
      input.focus()
      if (modeStates[mode].lastInput) {
        input.value = modeStates[mode].lastInput
      }
    }
  }, 100)
}

// 渲染当前激活模式的消息
function renderCurrentModeMessages() {
  const messagesContainer = document.getElementById(`${currentMode}Messages`)
  if (!messagesContainer) return

  // 清空容器
  messagesContainer.innerHTML = ''

  // 如果没有消息，显示欢迎消息
  if (modeStates[currentMode].messages.length === 0) {
    const welcomeHTML = getWelcomeMessage(currentMode)
    messagesContainer.innerHTML = welcomeHTML
    bindQuickPrompts()
  } else {
    // 渲染历史消息
    modeStates[currentMode].messages.forEach(msg => {
      appendMessageToContainer(currentMode, msg)
    })
  }

  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

function getWelcomeMessage(mode) {
  const welcomeMessages = {
    text: `<div class="message assistant">
      <div class="message-avatar">✨</div>
      <div class="message-content">
        <p>你好！我是 <strong>Gestalt 文本模式</strong>。</p>
        <p>描述你想要 AI 完成的任务，我会帮你优化成专业的提示词。</p>
        <div class="quick-prompts">
          <button class="quick-prompt" data-prompt="帮我设计一个产品经理角色的提示词">🎯 产品经理</button>
          <button class="quick-prompt" data-prompt="帮我分析代码安全漏洞">🔒 代码安全</button>
          <button class="quick-prompt" data-prompt="帮我写法律顾问提示词">⚖️ 法律顾问</button>
        </div>
      </div>
    </div>`,
    image: `<div class="message assistant">
      <div class="message-avatar">🎨</div>
      <div class="message-content">
        <p>你好！我是 <strong>Gestalt 图片模式</strong>。</p>
        <p>描述你想要生成的图片，我会帮你优化成专业的AI绘画提示词。</p>
        <div class="quick-prompts">
          <button class="quick-prompt" data-prompt="一只可爱的猫咪在花园里">🐱 猫咪</button>
          <button class="quick-prompt" data-prompt="未来赛博朋克城市夜景">🌃 赛博朋克</button>
          <button class="quick-prompt" data-prompt="中国山水画风格，山水意境">🏔️ 山水画</button>
        </div>
      </div>
    </div>`,
    video: `<div class="message assistant">
      <div class="message-avatar">🎬</div>
      <div class="message-content">
        <p>你好！我是 <strong>Gestalt 视频模式</strong>。</p>
        <p>描述你想要生成的视频内容，我会帮你优化成专业的AI视频提示词。</p>
        <div class="quick-prompts">
          <button class="quick-prompt" data-prompt="制作一个咖啡冲泡过程的教程视频">☕ 咖啡教程</button>
          <button class="quick-prompt" data-prompt="产品展示视频，科技感风格">📱 产品展示</button>
          <button class="quick-prompt" data-prompt="城市延时摄影，从白天到夜晚">🌆 延时摄影</button>
        </div>
      </div>
    </div>`,
    audio: `<div class="message assistant">
      <div class="message-avatar">🎵</div>
      <div class="message-content">
        <p>你好！我是 <strong>Gestalt 音频模式</strong>。</p>
        <p>描述你想要生成的音频内容，我会帮你优化成专业的AI音频提示词（支持音乐、音效等）。</p>
        <div class="quick-prompts">
          <button class="quick-prompt" data-prompt="制作一首轻松的咖啡厅背景音乐">☕ 咖啡厅音乐</button>
          <button class="quick-prompt" data-prompt="赛博朋克风格的电子音乐，适合游戏场景">🎮 游戏音乐</button>
          <button class="quick-prompt" data-prompt="电影预告片风格的史诗级管弦乐">🎬 电影配乐</button>
        </div>
      </div>
    </div>`
  }

  return welcomeMessages[mode] || welcomeMessages.text
}

// ==========================================
// 发送消息（核心逻辑 - 集成 RAG）
// ==========================================

async function handleSend(mode) {
  console.log('[Gestalt] handleSend 被调用, mode:', mode)

  const input = document.getElementById(`${mode}Input`)
  const content = input.value.trim()

  if (!content || modeStates[mode].isLoading) {
    return
  }

  if (!config || !config.apiKey) {
    showToast('请先设置API Key', 'warning')
    return
  }

  // 保存输入内容
  modeStates[mode].lastInput = content

  // 添加用户消息
  addMessage(mode, 'user', content)
  input.value = ''

  // 显示加载
  modeStates[mode].isLoading = true
  showLoading(mode)

  try {
    // 使用���的 RAG 增强编译系统
    const result = await compilePromptWithRAG(content, mode, contextEnabled)
    hideLoading(mode)

    // 添加AI回复（包含推理模式信息）
    const responseWithMetadata = `${result.explanation}\n\n${result.reasoningInfo || ''}`
    addMessage(mode, 'assistant', responseWithMetadata)

    // 显示输出
    if (result.prompt) {
      modeStates[mode].extractedPrompt = result.prompt
      modeStates[mode].lastReasoningMode = result.reasoningMode

      const outputEl = document.getElementById(`${mode}ExtractedPrompt`)
      const outputContainer = document.getElementById(`${mode}Output`)

      console.log('[Gestalt] 更新输出区域:', {
        mode,
        prompt: result.prompt.substring(0, 50) + '...',
        outputEl: outputEl?.id,
        outputContainer: outputContainer?.id,
        outputElExists: !!outputEl,
        outputContainerExists: !!outputContainer
      })

      if (outputEl) {
        if (outputEl.tagName === 'TEXTAREA') {
          outputEl.value = result.prompt
        } else {
          outputEl.textContent = result.prompt
        }
        console.log('[Gestalt] 输出内容已更新到元素:', outputEl.id)
      } else {
        console.error('[Gestalt] 找不到输出元素:', `${mode}ExtractedPrompt`)
      }

      if (outputContainer) {
        outputContainer.style.display = 'flex'
        console.log('[Gestalt] 输出容器已显示:', outputContainer.id)
      } else {
        console.error('[Gestalt] 找不到输出容器:', `${mode}Output`)
      }
    }

    // 保存到历史
    saveToHistory({
      mode,
      userInput: content,
      prompt: result.prompt,
      explanation: result.explanation,
      reasoningMode: result.reasoningMode
    })

    // 保存状态
    saveCurrentModeState()
  } catch (error) {
    hideLoading(mode)
    addMessage(mode, 'assistant', `错误: ${error.message}`)
    console.error('[Gestalt] 错误:', error)
  } finally {
    modeStates[mode].isLoading = false
  }
}

// ==========================================
// RAG 增强的提示词编译
// ==========================================

async function compilePromptWithRAG(userInput, mode, includeContext = true) {
  console.log('[Gestalt] RAG增强编译 - mode:', mode, 'context:', includeContext)

  // 1. 检测推理模式（使用 RAG 核心系统）
  const reasoningMode = typeof detectTextComplexity !== 'undefined'
    ? detectTextComplexity(userInput)
    : 'meta'

  // 2. RAG 增强：术语翻译
  let translationInfo = ''
  let domainInfo = ''

  if (typeof translateTerminology !== 'undefined') {
    const translation = translateTerminology(userInput)

    if (translation.domain) {
      domainInfo = `\n📚 检测到专业领域：${translation.domain}`

      if (translation.translations.length > 0) {
        translationInfo = `\n\n**术语优化：**\n${translation.translations
          .map(t => `- "${t.layman}" → "${t.expert}"`)
          .join('\n')}`

        // 使用翻译后的内容
        userInput = translation.translated
      }
    }
  }

  // 3. 生成系统提示词（使用新的提示词策略系统）
  let systemPrompt

  if (typeof getCompilerSystemPrompt !== 'undefined') {
    // 使用新的提示词系统
    systemPrompt = getCompilerSystemPrompt(mode, userInput, includeContext)
  } else {
    // 降级到旧系统
    systemPrompt = getFallbackSystemPrompt(mode, userInput)
  }

  // 4. 构建消息列表
  const messages = [
    { role: 'system', content: systemPrompt }
  ]

  // 5. 添加上下文（对话历史）
  let contextMessages = []
  if (includeContext) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tabId = tabs[0]?.id

      if (tabId) {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'GET_CONVERSATION_HISTORY'
        }).catch(() => null)

        if (response?.history && response.history.length > 0) {
          contextMessages = response.history.slice(-10) // 最多10条
        }
      }
    } catch (e) {
      console.log('[Gestalt] 获取上下文失败:', e)
    }
  }

  // 添加上下文
  if (contextMessages.length > 0) {
    messages.push({
      role: 'system',
      content: `\n**对话历史参考（最近${contextMessages.length}条）：**\n使用这些上下文来更好地理解用户需求。`
    })
    messages.push(...contextMessages)
  }

  // 添加用户输入
  messages.push({ role: 'user', content: userInput })

  // 6. 调用 LLM API
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('空结果')

  // 7. 提取最终提示词
  const prompt = extractPrompt(content)

  // 8. 构建推理模式信息
  let reasoningInfo = ''
  if (typeof getReasoningModeDisplayName !== 'undefined') {
    const modeInfo = getReasoningModeDisplayName(reasoningMode)
    reasoningInfo = `\n\n**推理模式**：${modeInfo.icon} ${modeInfo.name} (${modeInfo.complex度})${domainInfo}`
  }

  return {
    explanation: content,
    prompt: prompt,
    reasoningMode: reasoningMode,
    reasoningInfo: reasoningInfo.trim()
  }
}

// 降级系统提示词（当新库未加载时）
function getFallbackSystemPrompt(mode, userInput) {
  const prompts = {
    text: `# Role: 提示词优化专家
你��长将用户想法转化为专业的AI提示词。
请按以下格式输出：
1. 优化思路（1-2句话）
2. 优化后的提示词（Markdown代码块）`,

    image: `# Role: AI绘画提示词专家
你擅长将用户想法转化为专业的AI绘画提示词。
请输出英文提示词，包含：
1. Subject (主体描述)
2. Style (艺术风格)
3. Lighting & Mood (光照和氛围)
4. Composition (构图建议)
5. Details (细节描述)`,

    video: `# Role: AI视频提示词专家
你擅长将用户想法转化为专业的AI视频提示词。
请输出详细的视频提示词，包含：
1. Scene Description (场景描述)
2. Camera Movement (摄像机运动)
3. Pacing & Timing (节奏和时机)
4. Visual Style (视觉风格)
5. Key Elements (关键元素)`,

    audio: getAudioSystemPrompt(userInput)
  }

  return prompts[mode] || prompts.text
}

// 音频系统提示词（自动识别歌词/风格/播客/小说）
function getAudioSystemPrompt(userInput) {
  // 自动检测用户输入类型
  const detectedType = detectAudioType(userInput)

  if (detectedType === 'lyrics') {
    return `# Role: 专业歌词创作专家

你擅长将用户的想法转化为结构完整、富有感染力的歌词。

**用户输入分析：**
用户想要创作歌词，请将其优化为完整的歌曲结构。

**歌词结构要求：**
- 主歌 Verse
- 副歌 Chorus
- 桥段 Bridge (可选)
- 尾奏 Outro (可选)

**创作要点：**
1. 情感表达：通过歌词传达主题和情绪
2. 韵律流畅：确保歌词朗朗上口，适合演唱
3. 结构完整：包含完整的歌曲结构
4. 意象生动：使用具体、生动的意象和比喻
5. 风格统一：保持整首歌风格的一致性

**输出格式：**
1. 创作思路（1-2句话）
2. 完整歌词（Markdown代码块，包含结构标签）`
  } else if (detectedType === 'podcast') {
    return `# Role: 专业播客节目策划专家

你擅长将用户的想法转化为结构完整、引人入胜的播客节目脚本。

**用户输入分析：**
用户想要创作播客内容，请将其优化为专业的播客脚本。

**播客结构要求：**
- 开场白（话题引入、嘉宾介绍）
- 主体内容（对话、讨论、观点）
- 互动环节（问答、听众反馈）
- 结尾总结（要点回顾、下期预告）

**创作要点：**
1. 对话自然：模拟真实对话场景和语气
2. 节奏把控：确保内容流畅，有起承转合
3. 互动性强：设计引人入胜的互动环节
4. 专业性与亲和力并重
5. 明确的节目定位和风格

**输出格式：**
1. 节目策划思路（1-2句话）
2. 完整播客脚本（Markdown代码块，包含主持人和嘉宾对话）`
  } else if (detectedType === 'audiobook') {
    return `# Role: 专业有声书创作专家

你擅长将用户的想法转化为生动的有声书脚本或故事演播内容。

**用户输入分析：**
用户想要创作有声书或故事内容，请将其优化为专业的演播脚本。

**有声书结构要求：**
- 开场（场景铺垫、氛围营造）
- 章节内容（故事叙述、角色对话）
- 旁白解说（背景说明、情感引导）
- 结尾（章节小结、悬念设置）

**创作要点：**
1. 画面感强：通过语言营造生动的场景
2. 角色鲜明：不同角色有独特的语言风格
3. 节奏得当：控制叙述节奏，保持听众注意力
4. 情感丰富：通过语调和文字传达情感
5. 音效提示：标注需要的背景音乐和音效

**输出格式：**
1. 创作思路（1-2句话）
2. 完整演播脚本（Markdown代码块，包含角色、旁白标注）`
  } else {
    return `# Role: AI音乐风格描述专家 (Suno 专用)

你擅长将用户的想法转化为专业的AI音乐生成提示词，适用于 Suno、Udio 等平台。

**用户输入分析：**
用户想要优化音乐风格描述，请生成适合 Suno 的英文 prompt。

**风格描述要素：**
1. 音乐流派：电子、古典、爵士、摇滚、流行、环境音乐等
2. 情绪氛围：欢快、悲伤、紧张、放松、史诗、神秘、浪漫、恐怖等
3. 乐器配置：钢琴、吉他、小提琴、合成器、管弦乐等
4. 速度节奏：慢板、行板、中板、快板、急板 (BPM)
5. 声音特征：音色、音质、特殊效果

**输出格式：**
1. 优化思路（1-2句话）
2. 英文风格描述（Suno Prompt，Markdown代码块）

**示例格式：**
A [genre] song with [mood] atmosphere, featuring [instruments]. Tempo: [BPM], in [style] style.`
  }
}

// 自动检测音频类型（歌词 vs 风格 vs 播客 vs 小说）
function detectAudioType(userInput) {
  const input = userInput.toLowerCase()

  // 检测歌词关键词
  const lyricsKeywords = [
    '歌词', '写歌', '创作', '作歌', '歌曲', '诗', '唱',
    'verse', 'chorus', '主歌', '副歌', '桥段', 'hook',
    '一首', '来一首', '写出', '唱一首', '写首', '作曲'
  ]

  // 检测播客关键词
  const podcastKeywords = [
    '播客', 'podcast', '节目', '访谈', '对话', '聊天',
    '主播', '主持人', '嘉宾', '话题讨论', '访谈节目',
    '谈话', '脱口秀', '电台', '音频节目', '口播'
  ]

  // 检测小说/有声书关键词
  const audiobookKeywords = [
    '小说', '有声书', '故事', '朗读', '配音', '演播',
    '章节', '旁白', '角色', '叙述', '讲', '解读',
    '主播', '演播', '讲故事', '说书', '有声读物'
  ]

  // 检测风格关键词
  const styleKeywords = [
    '风格', '曲风', '音乐', '背景', '配乐', '音效',
    '电子', '古典', '爵士', '摇滚', '流行', '环境',
    '轻松', '快', '慢', '氛围', '情绪', '节奏',
    '钢琴', '吉他', '小提琴', '管弦', '电子乐'
  ]

  // 计算匹配分数
  const lyricsScore = lyricsKeywords.filter(kw => input.includes(kw)).length
  const podcastScore = podcastKeywords.filter(kw => input.includes(kw)).length
  const audiobookScore = audiobookKeywords.filter(kw => input.includes(kw)).length
  const styleScore = styleKeywords.filter(kw => input.includes(kw)).length

  // 找出最高分的类型
  const maxScore = Math.max(lyricsScore, podcastScore, audiobookScore, styleScore)

  if (maxScore === 0) return 'style' // 默认为风格

  if (lyricsScore === maxScore && lyricsScore > 0) return 'lyrics'
  if (podcastScore === maxScore && podcastScore > 0) return 'podcast'
  if (audiobookScore === maxScore && audiobookScore > 0) return 'audiobook'
  if (styleScore === maxScore && styleScore > 0) return 'style'

  return 'style' // 默认
}

// ==========================================
// 智能任务类型识别（用于快速优化）
// ==========================================

/**
 * 智能识别用户输入的任务类型
 * @param {string} userInput - 用户的输入文本
 * @returns {string} 返回 'text', 'image', 'video', 或 'audio'
 */
function detectTaskType(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return 'text'
  }

  const input = userInput.toLowerCase()

  // 图片生成关键词
  const imageKeywords = [
    '图片', '照片', '图像', '画', '绘画', '插画', '设计图',
    'photo', 'image', 'picture', 'draw', 'paint', 'illustrate',
    '生成图', '画一个', '图片生成', '视觉', '色彩', '构图',
    '风格化', '渲染', '角色设计', '场景', '视觉效果'
  ]

  // 视频生成关键词
  const videoKeywords = [
    '视频', '影片', '动画', '录像', '镜头', '运镜',
    'video', 'animation', 'film', 'clip', 'scene',
    '制作视频', '视频生成', '延时', '动态', '转场',
    '场景调度', '摄影', '帧', '特效', '影视'
  ]

  // 音频生成关键词（包括音乐、播客、小说等）
  const audioKeywords = [
    '音乐', '歌曲', '歌词', '配乐', '音效', '声音',
    'music', 'song', 'audio', 'sound', 'melody',
    '播客', 'podcast', '节目', '访谈', '主播',
    '小说', '有声书', '故事', '朗读', '配音', '演播',
    '钢琴', '吉他', '管弦', '电子乐', '古典', '爵士'
  ]

  // 计算匹配分数
  const imageScore = imageKeywords.filter(kw => input.includes(kw)).length
  const videoScore = videoKeywords.filter(kw => input.includes(kw)).length
  const audioScore = audioKeywords.filter(kw => input.includes(kw)).length

  // 找出最高分
  const maxScore = Math.max(imageScore, videoScore, audioScore)

  // 如果没有明确的关键词匹配，默认为文本
  if (maxScore === 0) {
    return 'text'
  }

  // 返回得分最高的类型
  if (imageScore === maxScore && imageScore > 0) return 'image'
  if (videoScore === maxScore && videoScore > 0) return 'video'
  if (audioScore === maxScore && audioScore > 0) return 'audio'

  return 'text' // 默认
}

function extractPrompt(text) {
  // 尝试多种格式提取
  // 1. Markdown 代码块
  let match = text.match(/```(?:markdown|prompt)?\n?([\s\S]*?)\n?```/)
  if (match) return match[1].trim()

  // 2. 引号包裹
  match = text.match(/"([^"]+)"/)
  if (match) return match[1]

  // 3. 【】标记
  match = text.match(/【[^】]*】[\s：:]*\n([\s\S]+?)(?=\n\n|$)/)
  if (match) return match[1].trim()

  // 4. 整个文本
  return text.trim()
}

// ==========================================
// 消息管理
// ==========================================

function addMessage(mode, role, content) {
  const message = {
    id: Date.now().toString(),
    role,
    content,
    timestamp: Date.now()
  }

  modeStates[mode].messages.push(message)
  appendMessageToContainer(mode, message)

  // 滚动到底部
  const container = document.getElementById(`${mode}Messages`)
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

function appendMessageToContainer(mode, message) {
  const container = document.getElementById(`${mode}Messages`)
  if (!container) return

  const div = document.createElement('div')
  div.className = `message ${message.role}`
  div.dataset.messageId = message.id

  const avatar = message.role === 'user' ? '👤' : '✨'

  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <p>${formatMessageContent(message.content)}</p>
      ${message.role === 'user' ? '<span class="edit-hint-text">✏️ 悬停编辑</span>' : ''}
    </div>
    ${message.role === 'user' ? `
      <button class="message-edit-btn" data-action="edit-message" data-mode="${mode}" data-message-id="${message.id}" title="编辑消息（可重新发送）">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    ` : ''}
  `

  container.appendChild(div)
}

function formatMessageContent(content) {
  // 简单的 Markdown 格式化
  return content
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n/g, '<br>')
}

// ==========================================
// 消息编辑功能
// ==========================================

// 编辑状态管理
const editingStates = {
  text: null,
  image: null,
  video: null,
  audio: null
}

// 开始编辑消息
window.startEditMessage = (mode, messageId) => {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
  if (!messageElement) return

  const message = modeStates[mode].messages.find(m => m.id === messageId)
  if (!message || message.role !== 'user') return

  // 保存编辑状态
  editingStates[mode] = messageId

  // 替换为编辑界面
  const contentDiv = messageElement.querySelector('.message-content')
  const editBtn = messageElement.querySelector('.message-edit-btn')

  if (editBtn) editBtn.style.display = 'none'

  contentDiv.innerHTML = `
    <div class="message-edit-container">
      <textarea class="message-edit-textarea" id="edit-${messageId}" rows="4">${message.content}</textarea>
      <div class="message-edit-actions">
        <button class="action-btn small" data-action="cancel-edit" data-mode="${mode}" data-message-id="${messageId}">
          ✕ 取消
        </button>
        <button class="action-btn small primary" data-action="confirm-edit" data-mode="${mode}" data-message-id="${messageId}">
          ✓ 确认并重新发送
        </button>
      </div>
      <div class="edit-hint">按 Enter 发送，Esc 取消</div>
    </div>
  `

  // 聚焦到编辑框
  const textarea = document.getElementById(`edit-${messageId}`)
  if (textarea) {
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)

    // 添加键盘事件
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        confirmEditMessage(mode, messageId)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelEditMessage(mode, messageId)
      }
    })
  }
}

// 取消编辑
window.cancelEditMessage = (mode, messageId) => {
  const message = modeStates[mode].messages.find(m => m.id === messageId)
  if (!message) return

  // 清除编辑状态
  editingStates[mode] = null

  // 恢复原始显示
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
  if (!messageElement) return

  const contentDiv = messageElement.querySelector('.message-content')
  const editBtn = messageElement.querySelector('.message-edit-btn')

  contentDiv.innerHTML = `
    <p>${formatMessageContent(message.content)}</p>
  `

  if (editBtn) editBtn.style.display = ''
}

// 确认编辑并重新发送
window.confirmEditMessage = async (mode, messageId) => {
  const textarea = document.getElementById(`edit-${messageId}`)
  if (!textarea) return

  const newContent = textarea.value.trim()
  if (!newContent) {
    showToast('内容不能为空', 'warning')
    return
  }

  const message = modeStates[mode].messages.find(m => m.id === messageId)
  if (!message) return

  // 找到消息的索引
  const messageIndex = modeStates[mode].messages.findIndex(m => m.id === messageId)

  // 保留该消���之前的所有消息
  const previousMessages = modeStates[mode].messages.slice(0, messageIndex)

  // 更新消息列表（删除编辑消息及之后的所有消息）
  modeStates[mode].messages = previousMessages

  // 清空容器并重新渲染之前的消息
  const container = document.getElementById(`${mode}Messages`)
  if (container) {
    container.innerHTML = ''

    // 重新渲染所有保留的消息
    previousMessages.forEach(msg => {
      const div = document.createElement('div')
      div.className = `message ${msg.role}`
      div.dataset.messageId = msg.id

      const avatar = msg.role === 'user' ? '👤' : '✨'

      div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <p>${formatMessageContent(msg.content)}</p>
          ${msg.role === 'user' ? '<span class="edit-hint-text">✏️ 悬停编辑</span>' : ''}
        </div>
        ${msg.role === 'user' ? `
          <button class="message-edit-btn" data-action="edit-message" data-mode="${mode}" data-message-id="${msg.id}" title="编辑消息（可重新发送）">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        ` : ''}
      `
      container.appendChild(div)
    })

    // 滚动到底部
    container.scrollTop = container.scrollHeight
  }

  // 清除编辑状态
  editingStates[mode] = null

  // 直接使用 handleSend，不创建新消息（handleSend 会创建）
  const input = document.getElementById(`${mode}Input`)
  if (input) {
    input.value = newContent
  }

  // 调用 handleSend，它会自动创建新消息并发送
  await handleSend(mode)
}

function showLoading(mode) {
  const sendBtn = document.getElementById(`${mode}SendBtn`)
  if (sendBtn) {
    sendBtn.dataset.originalText = sendBtn.textContent
    sendBtn.textContent = '发送中...'
    sendBtn.disabled = true
  }
}

function hideLoading(mode) {
  const sendBtn = document.getElementById(`${mode}SendBtn`)
  if (sendBtn) {
    sendBtn.textContent = sendBtn.dataset.originalText || '发送'
    sendBtn.disabled = false
  }
}

// ==========================================
// 提示词库管理
// ==========================================

async function loadPrompts() {
  const result = await chrome.storage.local.get(['gestaltPrompts'])
  prompts = result.gestaltPrompts || []
  renderPrompts()
}

function renderPrompts(filter = '') {
  if (!elements.libraryList) return

  const filtered = filter
    ? prompts.filter(p =>
        p.title.toLowerCase().includes(filter.toLowerCase()) ||
        p.content.toLowerCase().includes(filter.toLowerCase())
      )
    : prompts

  // 更新提示词计数
  const libraryCount = document.getElementById('libraryCount')
  if (libraryCount) {
    libraryCount.textContent = `${prompts.length} 个提示词`
  }

  if (filtered.length === 0) {
    elements.libraryList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>暂无保存的提示词</p>
        <p class="empty-hint">优化后点击"保存"添加提示词</p>
      </div>
    `
    return
  }

  elements.libraryList.innerHTML = filtered.map(p => `
    <div class="prompt-card" data-id="${p.id}">
      <div class="prompt-header">
        <h4>${escapeHtml(p.title)}</h4>
        <div class="prompt-actions">
          <button class="action-btn" data-action="use-prompt" data-prompt-id="${p.id}" title="使用">📋</button>
          <button class="action-btn" data-action="edit-prompt" data-prompt-id="${p.id}" title="编辑">✏️</button>
          <button class="action-btn" data-action="delete-prompt" data-prompt-id="${p.id}" title="删除">🗑️</button>
        </div>
      </div>
      <p class="prompt-desc">${escapeHtml(p.description || '')}</p>
      <div class="prompt-tags">
        ${(p.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </div>
  `).join('')
}

function filterPrompts(search) {
  renderPrompts(search)
}

// 编辑提示词库中的提示词
window.editLibraryPrompt = (id) => {
  const prompt = prompts.find(p => p.id === id)
  if (!prompt) return

  // 打开编辑弹窗
  const modal = document.getElementById('promptModal')
  if (!modal) return

  // 填充表单
  document.getElementById('promptTitle').value = prompt.title || ''
  document.getElementById('promptContent').value = prompt.content || ''
  document.getElementById('promptDescription').value = prompt.description || ''

  // 保存正在编辑的ID
  modal.dataset.editingId = id

  // 更改标题
  document.getElementById('promptModalTitle').textContent = '✏️ 编辑提示词'

  // 显示弹窗
  modal.style.display = 'flex'
}

async function handleSaveToLibrary(mode) {
  const prompt = modeStates[mode].extractedPrompt
  if (!prompt) {
    showToast('没有可保存的提示词', 'warning')
    return
  }

  const newPrompt = {
    id: Date.now().toString(),
    title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
    content: prompt,
    description: `${mode}模式 - ${new Date().toLocaleString()}`,
    tags: [mode],
    mode,
    createdAt: Date.now()
  }

  prompts.push(newPrompt)
  await chrome.storage.local.set({ gestaltPrompts: prompts })
  renderPrompts()
  showToast('已保存到提示词库', 'success')
}

// 全局函数（用于HTML onclick）
window.usePrompt = (id) => {
  const prompt = prompts.find(p => p.id === id)
  if (prompt) {
    // 关闭提示词库
    toggleLibrary()

    // 切换到提示词的模式（如果有的话）
    const targetMode = prompt.mode || currentMode
    if (prompt.mode && prompt.mode !== currentMode) {
      switchMode(prompt.mode)
    }

    // 等待模式切换完成
    setTimeout(() => {
      const input = document.getElementById(`${targetMode}Input`)
      if (input) {
        input.value = prompt.content
        input.focus()
        showToast(`已加载提示词 (${targetMode}模式)`, 'info')

        // 如果有优化结果，也显示出来
        if (prompt.prompt) {
          const outputEl = document.getElementById(`${targetMode}ExtractedPrompt`)
          const outputContainer = document.getElementById(`${targetMode}Output`)
          if (outputEl) {
            outputEl.value = prompt.prompt
          }
          if (outputContainer) {
            outputContainer.style.display = 'flex'
          }
        }
      }
    }, 150)
  }
}

window.deletePrompt = async (id) => {
  if (confirm('确定要删除这个提示词吗？')) {
    prompts = prompts.filter(p => p.id !== id)
    await chrome.storage.local.set({ gestaltPrompts: prompts })
    renderPrompts()
    showToast('已删除提示词', 'info')
  }
}

// ==========================================
// 历史记录管理
// ==========================================

async function loadHistory() {
  const result = await chrome.storage.local.get(['gestaltHistory'])
  history = result.gestaltHistory || []
  renderHistory()
}

function renderHistory() {
  if (!elements.historyList) return

  // 更新历史计数
  const historyCount = document.getElementById('historyCount')
  if (historyCount) {
    historyCount.textContent = `${history.length} 条记录`
  }

  if (history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <p>暂无历史记录</p>
        <p class="empty-hint">开始对话后，历史记录会显示在这里</p>
      </div>
    `
    return
  }

  elements.historyList.innerHTML = history.slice(0, 50).map(h => `
    <div class="history-item" data-id="${h.id}" data-mode="${h.mode}" data-action="reuse-history" data-history-id="${h.id}">
      <div class="history-item-header">
        <span class="history-mode">${getModeIcon(h.mode)} ${getModeName(h.mode)}</span>
        <span class="history-time">${formatTime(h.timestamp)}</span>
      </div>
      <p class="history-input">${escapeHtml(h.userInput.substring(0, 80))}${h.userInput.length > 80 ? '...' : ''}</p>
      ${h.reasoningMode ? `<div class="history-mode-tag">🧠 ${h.reasoningMode}</div>` : ''}
      ${h.prompt ? `<div class="history-prompt-preview">${escapeHtml(h.prompt.substring(0, 60))}...</div>` : ''}
      <div class="history-actions">
        <button class="action-btn small" data-action="reuse-history" data-history-id="${h.id}">
          📋 复用
        </button>
        <button class="action-btn small secondary" data-action="delete-history" data-history-id="${h.id}">
          🗑️ 删除
        </button>
      </div>
    </div>
  `).join('')
}

async function saveToHistory(item) {
  const historyItem = {
    id: Date.now().toString(),
    ...item,
    messages: modeStates[item.mode].messages, // 保存完整的消息列表
    timestamp: Date.now()
  }

  history.unshift(historyItem)
  // 只保留最近50条（减少存储）
  history = history.slice(0, 50)

  await chrome.storage.local.set({ gestaltHistory: history })
  renderHistory()
}

window.reuseHistory = (id) => {
  const item = history.find(h => h.id === id)
  if (!item) return

  // 关闭历史面板
  toggleHistory()

  // 切换到历史记录所在的模式
  const targetMode = item.mode || 'text'
  if (targetMode !== currentMode) {
    switchMode(targetMode)
  }

  // 等待模式切换完成后再填充内容和恢复对话
  setTimeout(() => {
    // 恢复消息列表
    if (item.messages && item.messages.length > 0) {
      modeStates[targetMode].messages = item.messages

      // 清空并重新渲染消息
      const container = document.getElementById(`${targetMode}Messages`)
      if (container) {
        container.innerHTML = ''
        item.messages.forEach(msg => {
          const div = document.createElement('div')
          div.className = `message ${msg.role}`
          div.dataset.messageId = msg.id

          const avatar = msg.role === 'user' ? '👤' : '✨'

          div.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
              <p>${formatMessageContent(msg.content)}</p>
              ${msg.role === 'user' ? '<span class="edit-hint-text">✏️ 悬停编辑</span>' : ''}
            </div>
            ${msg.role === 'user' ? `
              <button class="message-edit-btn" data-action="edit-message" data-mode="${targetMode}" data-message-id="${msg.id}" title="编辑消息（可重新发送）">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            ` : ''}
          `
          container.appendChild(div)
        })

        // 滚动到底部
        container.scrollTop = container.scrollHeight
      }
    }

    // 填充输入框
    const input = document.getElementById(`${targetMode}Input`)
    if (input && item.userInput) {
      input.value = item.userInput
    }

    // 填充优化结果
    if (item.prompt) {
      const outputEl = document.getElementById(`${targetMode}ExtractedPrompt`)
      const outputContainer = document.getElementById(`${targetMode}Output`)
      if (outputEl) {
        outputEl.value = item.prompt
      }
      if (outputContainer) {
        outputContainer.style.display = 'flex'
      }
      // 保存到状态
      modeStates[targetMode].extractedPrompt = item.prompt
    }

    // 聚焦输入框
    if (input) {
      input.focus()
    }

    showToast(`已恢复对话 (${getModeName(targetMode)}模式)`, 'info')
  }, 150)
}

// 删除单条历史记录
window.deleteHistoryItem = async (id) => {
  if (confirm('确定要删除这条历史记录吗？')) {
    history = history.filter(h => h.id !== id)
    await chrome.storage.local.set({ gestaltHistory: history })
    renderHistory()
    showToast('已删除历史记录', 'info')
  }
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 如果是今天，显示时间
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 如果是昨天，显示"昨天"
  else if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 其他情况显示日期
  else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
}

// 获取模式名称
function getModeName(mode) {
  const names = {
    text: '文本',
    image: '图片',
    video: '视频',
    audio: '音频'
  }
  return names[mode] || '文本'
}

function getModeIcon(mode) {
  const icons = { text: '📝', image: '🎨', video: '🎬', audio: '🎵' }
  return icons[mode] || '📝'
}

async function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？')) {
    history = []
    await chrome.storage.local.set({ gestaltHistory: history })
    renderHistory()
    showToast('历史记录已清空', 'info')
  }
}

// ==========================================
// 面板切换
// ==========================================

function toggleLibrary() {
  if (!elements.libraryPanel) return

  const isVisible = elements.libraryPanel.style.display !== 'none'

  // 切换显示状态
  if (isVisible) {
    elements.libraryPanel.style.display = 'none'
    elements.libraryBtn.classList.remove('active')
  } else {
    elements.libraryPanel.style.display = 'flex'
    elements.libraryBtn.classList.add('active')
    // 渲染提示词列表
    renderPrompts()
  }

  // 隐藏其他面板
  if (elements.historyPanel) {
    elements.historyPanel.style.display = 'none'
  }
  elements.historyBtn?.classList.remove('active')

  // 隐藏所有模式面板（当提示词库打开时）
  if (!isVisible) {
    document.querySelectorAll('.mode-chat-panel').forEach(panel => {
      if (panel.style.display !== 'none') {
        panel.dataset.previousDisplay = 'true'
        panel.style.display = 'none'
      }
    })
  } else {
    // 恢复之前显示的面板
    document.querySelectorAll('.mode-chat-panel').forEach(panel => {
      if (panel.dataset.previousDisplay === 'true') {
        panel.style.display = 'flex'
        delete panel.dataset.previousDisplay
      }
    })
  }
}

function toggleHistory() {
  if (!elements.historyPanel) return

  const isVisible = elements.historyPanel.style.display !== 'none'

  // 切换显示状态
  if (isVisible) {
    elements.historyPanel.style.display = 'none'
    elements.historyBtn.classList.remove('active')
  } else {
    elements.historyPanel.style.display = 'flex'
    elements.historyBtn.classList.add('active')
    renderHistory()
  }

  // 隐藏其他面板
  if (elements.libraryPanel) {
    elements.libraryPanel.style.display = 'none'
  }
  elements.libraryBtn?.classList.remove('active')

  // 隐藏所有模式面板（当历史记录打开时）
  if (!isVisible) {
    document.querySelectorAll('.mode-chat-panel').forEach(panel => {
      if (panel.style.display !== 'none') {
        panel.dataset.previousDisplay = 'true'
        panel.style.display = 'none'
      }
    })
  } else {
    // 恢复之前显示的面板
    document.querySelectorAll('.mode-chat-panel').forEach(panel => {
      if (panel.dataset.previousDisplay === 'true') {
        panel.style.display = 'flex'
        delete panel.dataset.previousDisplay
      }
    })
  }
}

function closeHistory() {
  if (elements.historyPanel) {
    elements.historyPanel.style.display = 'none'
  }
  elements.historyBtn?.classList.remove('active')
}

// ==========================================
// 设置弹窗
// ==========================================

function openSettings() {
  if (elements.settingsModal) {
    elements.settingsModal.style.display = 'flex'
  }
}

function closeSettings() {
  if (elements.settingsModal) {
    elements.settingsModal.style.display = 'none'
  }
}

async function handleSaveConfig() {
  const newConfig = {
    apiKey: elements.apiKeyInput?.value || '',
    baseUrl: elements.baseUrlSelect?.value || 'https://api.deepseek.com/v1',
    modelName: elements.modelNameInput?.value || 'deepseek-chat'
  }

  await saveConfig(newConfig)
  closeSettings()
}

// ==========================================
// 导出导入功能
// ==========================================

async function handleExport() {
  try {
    // 收集所有数据
    const exportData = {
      version: '2.0.0',
      exportTime: new Date().toISOString(),
      config: {
        baseUrl: config?.baseUrl,
        modelName: config?.modelName
        // 不导出 apiKey 以保护隐私
      },
      prompts: prompts,
      history: history.map(h => ({
        ...h,
        // 清理一些不必要的数据
        messages: h.messages?.slice(-10) // 只保留最近10条消息
      }))
    }

    // 转换为 JSON 字符串
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // 创建下载链接并触发下载
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `gestalt-backup-${timestamp}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('�� 导出成功', 'success')
    console.log('[Gestalt] 导出数据:', exportData)
  } catch (error) {
    console.error('[Gestalt] 导出失败:', error)
    showToast('导出失败: ' + error.message, 'error')
  }
}

async function handleImport() {
  try {
    // 创建文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        // 读取文件
        const text = await file.text()
        const importData = JSON.parse(text)

        // 验证数据格式
        if (!importData.version || !importData.prompts) {
          throw new Error('无效的备份文件格式')
        }

        // 确认导入
        const promptCount = importData.prompts?.length || 0
        const historyCount = importData.history?.length || 0

        const confirmed = confirm(
          `准备导入数据：\n\n` +
          `📚 提示词: ${promptCount} 条\n` +
          `📜 历史记录: ${historyCount} 条\n\n` +
          `注意：导入会合并到现有数据中，不会覆盖。\n\n` +
          `是否继续？`
        )

        if (!confirmed) return

        // 导入提示词（合并，不覆盖）
        if (importData.prompts && Array.isArray(importData.prompts)) {
          const existingIds = new Set(prompts.map(p => p.id))
          const newPrompts = importData.prompts.filter(p => !existingIds.has(p.id))

          if (newPrompts.length > 0) {
            prompts = [...prompts, ...newPrompts]
            await chrome.storage.local.set({ gestaltPrompts: prompts })
            console.log(`[Gestalt] 导入了 ${newPrompts.length} 条新提示词`)
          }
        }

        // 导入历史记录（合并，不覆盖）
        if (importData.history && Array.isArray(importData.history)) {
          const existingIds = new Set(history.map(h => h.id))
          const newHistory = importData.history.filter(h => !existingIds.has(h.id))

          if (newHistory.length > 0) {
            history = [...history, ...newHistory]
            await chrome.storage.local.set({ gestaltHistory: history })
            console.log(`[Gestalt] 导入了 ${newHistory.length} 条新历史记录`)
          }
        }

        // 刷新显示
        renderPrompts()
        renderHistory()

        showToast(
          `✅ 导入成功！\n新增提示词: ${promptCount} 条\n新增历史: ${historyCount} 条`,
          'success'
        )
      } catch (error) {
        console.error('[Gestalt] 导入文件解析失败:', error)
        showToast('导入失败: ' + error.message, 'error')
      }
    }

    input.click()
  } catch (error) {
    console.error('[Gestalt] 导入失败:', error)
    showToast('导入失败: ' + error.message, 'error')
  }
}

// ==========================================
// 操作处理
// ==========================================

async function handleCopy(mode) {
  const prompt = modeStates[mode].extractedPrompt
  if (!prompt) {
    showToast('没有可复制的内容', 'warning')
    return
  }

  try {
    await navigator.clipboard.writeText(prompt)
    showToast('已复制到剪贴板', 'success')
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败', 'error')
  }
}

async function handleInsert(mode) {
  const prompt = modeStates[mode].extractedPrompt
  if (!prompt) {
    showToast('没有可插入的内容', 'warning')
    return
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'INSERT_PROMPT',
        prompt: prompt
      }, (response) => {
        if (response?.success) {
          showToast('已插入到输入框', 'success')
        } else {
          showToast('插入失败，已复制到剪贴板', 'warning')
        }
      })
    }
  } catch (err) {
    console.error('插入失败:', err)
    showToast('插入失败', 'error')
  }
}

// ==========================================
// Toast 通知
// ==========================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// ==========================================
// 工具函数
// ==========================================

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 添加CSS动画
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .memory-active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    border-color: #667eea !important;
  }
`
document.head.appendChild(style)
