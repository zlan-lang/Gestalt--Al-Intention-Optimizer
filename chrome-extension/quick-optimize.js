// ==========================================
// Gestalt 快速优化面板逻辑
// 专注于：快速优化 + 一键插入
// ==========================================

(function() {
  'use strict'

  // 状态管理
  const state = {
    config: null,
    userInput: '',
    optimizedPrompt: '',
    isOptimizing: false,
    platform: null,
    selectedText: ''
  }

  // DOM 元素
  const elements = {
    userInput: document.getElementById('userInput'),
    charCount: document.getElementById('charCount'),
    optimizeBtn: document.getElementById('optimizeBtn'),
    insertBtn: document.getElementById('insertBtn'),
    copyBtn: document.getElementById('copyBtn'),
    editBtn: document.getElementById('editBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    advancedBtn: document.getElementById('advancedBtn'),
    closeBtn: document.getElementById('closeBtn'),
    inputSection: document.getElementById('inputSection'),
    optimizingSection: document.getElementById('optimizingSection'),
    resultSection: document.getElementById('resultSection'),
    advancedSection: document.getElementById('advancedSection'),
    taskType: document.getElementById('taskType'),
    intensity: document.getElementById('intensity')
  }

  // ==========================================
  // 初始化
  // ==========================================

  async function init() {
    console.log('[Gestalt Quick Optimize] 初始化')

    // 加载配置
    await loadConfig()

    // 检测平台
    await detectPlatform()

    // 获取选中的文本（如果有）
    await getSelectedText()

    // 绑定事件
    bindEvents()

    // 自动填充
    if (state.selectedText) {
      elements.userInput.value = state.selectedText
      updateCharCount()
    }

    // 聚焦输入框
    elements.userInput.focus()
  }

  // 加载配置
  async function loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['gestaltConfig'], (result) => {
        if (result.gestaltConfig && result.gestaltConfig.apiKey) {
          state.config = result.gestaltConfig
        } else {
          // 使用默认配置
          state.config = {
            apiKey: 'sk-aaceedc5897743158c4b099dc08b24c5',
            baseUrl: 'https://api.deepseek.com/v1',
            modelName: 'deepseek-chat',
            language: 'zh'
          }
          // 首次使用时自动保存默认配置
          chrome.storage.local.set({ gestaltConfig: state.config })
        }
        resolve()
      })
    })
  }

  // 检测平台
  async function detectPlatform() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          const url = tabs[0].url
          if (url.includes('chatgpt.com')) state.platform = 'chatgpt'
          else if (url.includes('claude.ai')) state.platform = 'claude'
          else if (url.includes('gemini.google.com')) state.platform = 'gemini'
          else if (url.includes('deepseek.com')) state.platform = 'deepseek'
          else if (url.includes('perplexity.ai')) state.platform = 'perplexity'
        }
        resolve()
      })
    })
  }

  // 获取选中的文本
  async function getSelectedText() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'GET_SELECTED_TEXT'
          }, (response) => {
            state.selectedText = response?.text || ''
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  }

  // ==========================================
  // 事件绑定
  // ==========================================

  function bindEvents() {
    // 输入框事件
    elements.userInput.addEventListener('input', updateCharCount)
    elements.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleOptimize()
      }
    })

    // 按钮事件
    elements.optimizeBtn.addEventListener('click', handleOptimize)
    elements.insertBtn.addEventListener('click', handleInsert)
    elements.copyBtn.addEventListener('click', handleCopy)
    elements.editBtn.addEventListener('click', handleEdit)
    elements.pasteBtn.addEventListener('click', handlePaste)
    elements.closeBtn.addEventListener('click', handleClose)
    elements.advancedBtn.addEventListener('click', toggleAdvanced)
  }

  // 更新字符计数
  function updateCharCount() {
    const length = elements.userInput.value.length
    elements.charCount.textContent = `${length} 字符`
  }

  // ==========================================
  // 核心功能：优化
  // ==========================================

  async function handleOptimize() {
    const input = elements.userInput.value.trim()

    if (!input) {
      showToast('请输入要优化的内容', 'error')
      elements.userInput.focus()
      return
    }

    if (state.isOptimizing) return

    // 开始优化
    state.isOptimizing = true
    state.userInput = input

    // 切换UI状态
    showOptimizing()

    try {
      // 调用优化API
      const result = await optimizePrompt(input)

      // 保存结果
      state.optimizedPrompt = result.prompt

      // 显示结果
      showResult(result)

    } catch (error) {
      console.error('[Gestalt] 优化失败:', error)
      showToast(`优化失败: ${error.message}`, 'error')
      showInput()
    } finally {
      state.isOptimizing = false
    }
  }

  // 优化提示词
  async function optimizePrompt(input) {
    const taskType = elements.taskType.value
    const intensity = elements.intensity.value

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(taskType, intensity)

    // 调用API
    const response = await fetch(`${state.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.config.apiKey}`
      },
      body: JSON.stringify({
        model: state.config.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API 错误: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('AI 返回空结果')
    }

    // 提取提示词
    const prompt = extractPrompt(content)

    return {
      prompt,
      explanation: content
    }
  }

  // 构建系统提示词
  function buildSystemPrompt(taskType, intensity) {
    const taskPrompts = {
      auto: '你是 Gestalt AI 助手，擅长将用户的原始想法转化为专业、清晰、有效的AI提示词。',
      text: '你是文本生成专家，擅长创建用于生成高质量文本的提示词。',
      code: '你是代码专家，擅长创建用于编程、代码审查和技术问题的提示词。',
      analysis: '你是分析专家，擅长创建用于分析、总结和洞察的提示词。',
      creative: '你是创意写作专家，擅长创建用于创意内容和写作的提示词。'
    }

    const intensityPrompts = {
      light: '请进行轻度优化：保持用户原始语气，仅做必要的结构调整和补充。',
      medium: '请进行中度优化：改善结构，添加必要的上下文，使提示词更加专业。',
      strong: '请进行深度优化：完全重构提示词，添加详细的角色定义、任务说明和输出要求。'
    }

    return `${taskPrompts[taskType]}

${intensityPrompts[intensity]}

请按以下格式输出：
1. 简要说明优化思路（1-2句话）
2. 优化后的提示词（使用 Markdown 代码块）

注意事项：
- 保持提示词简洁而专业
- 添加必要的上下文和约束
- 明确输出格式和要求
- 使用 ICIO 框架（Input, Context, Instruction, Output）

现在开始优化用户输入。`
  }

  // 从响应中提取提示词
  function extractPrompt(content) {
    // 尝试提取 Markdown 代码块
    const codeBlockMatch = content.match(/```(?:markdown)?\n([\s\S]*?)\n```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }

    // 如果没有代码块，返回整个内容
    return content.trim()
  }

  // ==========================================
  // UI 状态管理
  // ==========================================

  function showInput() {
    elements.inputSection.style.display = 'block'
    elements.optimizingSection.style.display = 'none'
    elements.resultSection.style.display = 'none'
  }

  function showOptimizing() {
    elements.inputSection.style.display = 'none'
    elements.optimizingSection.style.display = 'flex'
    elements.resultSection.style.display = 'none'
  }

  function showResult(result) {
    elements.inputSection.style.display = 'none'
    elements.optimizingSection.style.display = 'none'
    elements.resultSection.style.display = 'block'

    // 显示优化后的提示词
    document.getElementById('optimizedPrompt').textContent = result.prompt
  }

  function toggleAdvanced() {
    const isHidden = elements.advancedSection.style.display === 'none'
    elements.advancedSection.style.display = isHidden ? 'block' : 'none'

    const icon = elements.advancedBtn.querySelector('svg')
    if (icon) {
      icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)'
    }
  }

  // ==========================================
  // 操作功能
  // ==========================================

  async function handleInsert() {
    if (!state.optimizedPrompt) return

    showToast('正在插入...', 'info')

    try {
      // 获取当前标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })

      if (tabs[0]?.id) {
        // 尝试直接发送消息
        let response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'INSERT_PROMPT',
          prompt: state.optimizedPrompt
        }).catch(() => null)

        // 如果消息发送失败，尝试动态注入脚本
        if (!response) {
          console.log('[Gestalt] 内容脚本未响应，尝试动态注入...')
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['simple-insert.js']
            })
            await new Promise(r => setTimeout(r, 300))

            response = await chrome.tabs.sendMessage(tabs[0].id, {
              type: 'INSERT_PROMPT',
              prompt: state.optimizedPrompt
            })
          } catch (e) {
            console.log('[Gestalt] 动态注入失败:', e)
          }
        }

        if (response?.success) {
          showToast('✅ 已插入到 AI 对话', 'success')

          // 保存到历史记录
          saveToHistory(state.optimizedPrompt)

          // 延迟关闭面板
          setTimeout(() => {
            window.close()
          }, 1500)
        } else {
          throw new Error('插入失败')
        }
      }
    } catch (error) {
      console.error('[Gestalt] 插入错误:', error)

      // 降级：复制到剪贴板
      await navigator.clipboard.writeText(state.optimizedPrompt)
      showToast('已复制到剪贴板，请手动粘贴', 'warning')
    }
  }

  async function handleCopy() {
    if (!state.optimizedPrompt) return

    try {
      await navigator.clipboard.writeText(state.optimizedPrompt)
      showToast('✅ 已复制到剪贴板', 'success')
    } catch (error) {
      showToast('复制失败', 'error')
    }
  }

  function handleEdit() {
    // 将优化后的提示词放回输入框
    elements.userInput.value = state.optimizedPrompt
    updateCharCount()
    showInput()
    elements.userInput.focus()
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      elements.userInput.value = text
      updateCharCount()
      showToast('已粘贴', 'success')
    } catch (error) {
      showToast('无法访问剪贴板', 'error')
    }
  }

  function handleClose() {
    window.close()
  }

  // ==========================================
  // 辅助功能
  // ==========================================

  // 保存到历史记录
  function saveToHistory(prompt) {
    chrome.storage.local.get(['gestaltHistory'], (result) => {
      const history = result.gestaltHistory || []
      history.unshift({
        prompt,
        timestamp: Date.now(),
        platform: state.platform
      })

      // 只保留最近100条
      if (history.length > 100) {
        history.pop()
      }

      chrome.storage.local.set({ gestaltHistory: history })
    })
  }

  // 显示 Toast 通知
  function showToast(message, type = 'info') {
    // 创建 toast 元素
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message

    // 添加样式
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      background: type === 'success' ? '#10b981' :
                   type === 'error' ? '#ef4444' :
                   type === 'warning' ? '#f59e0b' : '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-10px)',
      transition: 'all 0.3s ease'
    })

    document.body.appendChild(toast)

    // 显示动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateY(0)'
    })

    // 自动消失
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(-10px)'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  // ==========================================
  // 启动
  // ==========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
