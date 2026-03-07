// ==========================================
// Gestalt Chrome Extension - Enhanced Content Script
// 负责与目标网页交互，注入UI元素和浮动按钮
// ==========================================

(function() {
  'use strict'

  console.log('[Gestalt] Enhanced Content Script 已加载')

  // 配置
  const CONFIG = {
    maxRetries: 5,
    retryDelay: 500,
    floatButtonSize: 56,
    animationDuration: 300
  }

  // 平台选择器配置
  const PLATFORM_SELECTORS = {
    chatgpt: {
      name: 'ChatGPT',
      input: [
        '#prompt-textarea',
        'textarea[data-id="request-:"]',
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="Send"]',
        'textarea',
        'div[contenteditable="true"][role="textbox"]'
      ],
      sendButton: [
        'button[data-testid="send-button"]',
        'button[aria-label="Send"]',
        'button[type="submit"]'
      ],
      // 对话历史选择器
      conversation: [
        '[data-message-author-role="user"]',
        '[data-message-author-role="assistant"]',
        'div[class*="message"]',
        'div[data-role="user"]',
        'div[data-role="assistant"]'
      ],
      userMessage: [
        '[data-message-author-role="user"]',
        '[data-role="user"]',
        'div[class*="user"]'
      ],
      assistantMessage: [
        '[data-message-author-role="assistant"]',
        '[data-role="assistant"]',
        'div[class*="assistant"]'
      ],
      urlPatterns: ['chatgpt.com', 'chat.openai.com']
    },
    claude: {
      name: 'Claude',
      input: [
        'div[contenteditable="true"][data-value]',
        'textarea[placeholder*="发送消息"]',
        'textarea[placeholder*="Send a message"]',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label="Send"]'
      ],
      conversation: [
        'div[data-testid*="message"]',
        'div[class*="ConversationItem"]'
      ],
      userMessage: [
        '[data-testid*="user"]',
        'div[class*="user"]'
      ],
      assistantMessage: [
        '[data-testid*="assistant"]',
        'div[class*="assistant"]'
      ],
      urlPatterns: ['claude.ai']
    },
    gemini: {
      name: 'Gemini',
      input: [
        'rich-textarea div[contenteditable="true"]',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="Enter"]',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[aria-label="Send"]',
        'button[type="submit"]'
      ],
      conversation: [
        'chat-message',
        'div[slot="content"]'
      ],
      userMessage: [
        'chat-message[role="user"]',
        '[role="user"]'
      ],
      assistantMessage: [
        'chat-message[role="model"]',
        '[role="model"]'
      ],
      urlPatterns: ['gemini.google.com']
    },
    deepseek: {
      name: 'DeepSeek',
      input: [
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="Enter"]',
        'div[contenteditable="true"]',
        'textarea'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label="Send"]'
      ],
      conversation: [
        '.message',
        '.chat-message'
      ],
      userMessage: [
        '.message-user',
        '[data-role="user"]'
      ],
      assistantMessage: [
        '.message-assistant',
        '[data-role="assistant"]'
      ],
      urlPatterns: ['deepseek.com', 'chat.deepseek.com']
    },
    perplexity: {
      name: 'Perplexity',
      input: [
        'textarea[placeholder*="Ask"]',
        'div[contenteditable="true"]',
        'textarea'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label="Submit"]'
      ],
      conversation: [
        '.message',
        '[data-testid*="result"]'
      ],
      userMessage: [
        '[data-testid*="user-input"]'
      ],
      assistantMessage: [
        '[data-testid*="answer"]'
      ],
      urlPatterns: ['perplexity.ai', 'www.perplexity.ai']
    },
    // 豆包
    doubao: {
      name: '豆包',
      input: [
        'textarea[placeholder*="发送"]',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="说"]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label*="发送"]'
      ],
      conversation: [
        '.message',
        '.chat-message'
      ],
      userMessage: [
        '.message-user',
        '[data-role="user"]'
      ],
      assistantMessage: [
        '.message-assistant',
        '[data-role="assistant"]'
      ],
      urlPatterns: ['doubao.com', 'www.doubao.com', 'ark.cn volc.cn']
    },
    // Kimi
    kimi: {
      name: 'Kimi',
      input: [
        'textarea[placeholder*="发送"]',
        'textarea[placeholder*="Message"]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label*="发送"]'
      ],
      conversation: [
        '.message-item',
        '.chat-message'
      ],
      userMessage: [
        '.message-item-user',
        '[data-role="user"]'
      ],
      assistantMessage: [
        '.message-item-assistant',
        '[data-role="assistant"]'
      ],
      urlPatterns: ['kimi.moonshot.cn', 'kimi.com']
    },
    // 文心一言
    yiyan: {
      name: '文心一言',
      input: [
        'textarea[placeholder*="请输入"]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]'
      ],
      conversation: [
        '.message',
        '.chat-message'
      ],
      userMessage: [
        '.user-message'
      ],
      assistantMessage: [
        '.assistant-message'
      ],
      urlPatterns: ['yiyan.baidu.com']
    },
    // 通义千问
    tongyi: {
      name: '通义千问',
      input: [
        'textarea[placeholder*="发送"]',
        'textarea[placeholder*="输入"]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]'
      ],
      conversation: [
        '.message',
        '.chat-message'
      ],
      userMessage: [
        '.user-message'
      ],
      assistantMessage: [
        '.assistant-message'
      ],
      urlPatterns: ['tongyi.aliyun.com', 'tongyi.qianwen.aliyun.com']
    },
    // Copilot
    copilot: {
      name: 'Copilot',
      input: [
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="message"]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label="Send"]'
      ],
      conversation: [
        '.message',
        '[data-message-type]'
      ],
      userMessage: [
        '[data-message-type="user"]'
      ],
      assistantMessage: [
        '[data-message-type="assistant"]'
      ],
      urlPatterns: ['copilot.microsoft.com', 'copilot.azure.com']
    },
    // Suno AI 音乐生成
    suno: {
      name: 'Suno',
      input: [
        'textarea[placeholder*="Lyrics"]',
        'textarea[placeholder*="lyrics"]',
        'textarea[placeholder*="Description of the song"]',
        'textarea[placeholder*="description"]',
        'textarea[id*="lyrics"]',
        'textarea[id*="prompt"]',
        'textarea[id*="style"]',
        'textarea',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label*="Create"]',
        'button[aria-label*="Generate"]',
        'button[aria-label*="Make"]'
      ],
      conversation: [
        '.song-item',
        '.track-item',
        '[class*="song"]'
      ],
      userMessage: [
        '[data-type="user"]'
      ],
      assistantMessage: [
        '[data-type="assistant"]'
      ],
      urlPatterns: ['suno.com', 'www.suno.com']
    },
    // 通用平台（兜底方案）
    generic: {
      name: '通用AI',
      input: [
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="Send"]',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="请输入"]',
        'textarea[placeholder*="提问"]',
        'textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label*="Send"]',
        'button[aria-label*="发送"]'
      ],
      conversation: [
        'div[class*="message"]',
        'div[class*="chat"]'
      ],
      userMessage: [
        '[data-role="user"]',
        'div[class*="user"]'
      ],
      assistantMessage: [
        '[data-role="assistant"]',
        'div[class*="assistant"]'
      ],
      urlPatterns: []  // 通用平台不通过URL匹配
    }
  }

  // 当前平台
  let currentPlatform = null
  let floatingButton = null
  let isButtonVisible = true

  // 初始化
  function init() {
    currentPlatform = detectPlatform()
    console.log('[Gestalt] 当前平台:', currentPlatform?.name || 'Unknown')

    // 如果没有检测到特定平台，但页面可能有输入框，也尝试创建按钮
    if (!currentPlatform) {
      // 延迟检测，给页面更多时间加载
      setTimeout(() => {
        currentPlatform = detectPlatform()
        if (currentPlatform) {
          createFloatingButton()
          observePageChanges()
        } else {
          // 再尝试一次，使用更宽松的检测
          setTimeout(() => {
            const hasInputBox = findGenericInputBox()
            if (hasInputBox) {
              currentPlatform = { key: 'generic', name: 'AI助手', ...PLATFORM_SELECTORS.generic }
              createFloatingButton()
              observePageChanges()
            }
          }, 2000)
        }
      }, 1500)
    } else {
      createFloatingButton()
      observePageChanges()
    }

    // 检查是否存在可能是AI聊天的输入框
    function findGenericInputBox() {
      const selectors = [
        'textarea[placeholder*="ai" i]',
        'textarea[placeholder*="chat" i]',
        'textarea[placeholder*="message" i]',
        'textarea[placeholder*="问题" i]',
        'textarea[placeholder*="搜索" i]',
        'textarea[placeholder*="ask" i]',
        'textarea[aria-label*="chat" i]',
        'textarea[aria-label*="message" i]',
        'div[contenteditable="true"][aria-label*="chat" i]',
        'div[contenteditable="true"][role="textbox"]',
        'form textarea',
        'main textarea'
      ]

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector)
          if (element && isElementVisible(element)) {
            return true
          }
        } catch (e) {
          continue
        }
      }

      // 检查是否有较大的textarea
      const textareas = document.querySelectorAll('textarea')
      for (const textarea of textareas) {
        if (isElementVisible(textarea) && textarea.offsetWidth * textarea.offsetHeight > 10000) {
          return true
        }
      }

      return false
    }

    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener(handleMessage)
  }

  // 检测平台
  function detectPlatform() {
    const url = window.location.href

    // 先尝试精确匹配已知平台
    for (const [key, platform] of Object.entries(PLATFORM_SELECTORS)) {
      if (key === 'generic') continue  // 跳过通用平台
      if (platform.urlPatterns && platform.urlPatterns.length > 0) {
        if (platform.urlPatterns.some(pattern => url.includes(pattern))) {
          return { key, ...platform }
        }
      }
    }

    // 如果没有精确匹配，尝试使用通用平台（只要能找到输入框）
    const genericPlatform = PLATFORM_SELECTORS.generic
    // 检查URL是否像是AI聊天平台
    const isLikelyAIPlatform = url.includes('chat') ||
                                url.includes('ai') ||
                                url.includes('llm') ||
                                url.includes('gpt') ||
                                url.includes('claude') ||
                                url.includes('gemini') ||
                                url.includes('bot') ||
                                url.includes('assistant') ||
                                url.includes('prompt')

    if (isLikelyAIPlatform) {
      return { key: 'generic', ...genericPlatform }
    }

    return null
  }

  // 创建浮动按钮
  function createFloatingButton() {
    // 防止重复创建
    if (floatingButton) return

    floatingButton = document.createElement('div')
    floatingButton.id = 'gestalt-floating-button'
    floatingButton.innerHTML = `
      <div class="gestalt-fab-tooltip">单击优化 | 双击面板 | 长按拖拽</div>
      <div class="gestalt-fab-content" title="单击：优化输入框内容 | 双击：打开完整面板 | 右键：菜单">
        <span style="font-size: 20px;">✨</span>
      </div>
    `

    // 添加样式
    const style = document.createElement('style')
    style.textContent = getFloatingButtonStyles()
    document.head.appendChild(style)

    // 添加到页面
    document.body.appendChild(floatingButton)

    // 绑定事件
    bindFloatingButtonEvents()

    // 加载保存的位置
    loadButtonPosition(floatingButton)

    // 添加动画
    setTimeout(() => {
      floatingButton.classList.add('gestalt-fab-visible')
    }, 100)
  }

  // 浮动按钮样式
  function getFloatingButtonStyles() {
    return `
      #gestalt-floating-button {
        position: fixed;
        bottom: 80px;
        right: 24px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #gestalt-floating-button.gestalt-fab-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      #gestalt-floating-button.gestalt-fab-hidden {
        opacity: 0;
        transform: translateY(20px) scale(0.8);
        pointer-events: none;
      }

      .gestalt-fab-content {
        width: ${CONFIG.floatButtonSize}px;
        height: ${CONFIG.floatButtonSize}px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: white;
        position: relative;
      }

      .gestalt-fab-content:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
      }

      .gestalt-fab-content:active {
        transform: scale(0.95);
      }

      /* 浮动按钮小提示 */
      .gestalt-fab-tooltip {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        background: #1e293b;
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        white-space: nowrap;
        margin-right: 10px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      .gestalt-fab-tooltip::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        border: 6px solid transparent;
        border-left-color: #1e293b;
      }

      #gestalt-floating-button:hover .gestalt-fab-tooltip {
        opacity: 1;
      }

      .gestalt-fab-menu {
        position: absolute;
        bottom: ${CONFIG.floatButtonSize + 12}px;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 8px;
        min-width: 200px;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .gestalt-fab-menu.gestalt-fab-menu-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .gestalt-fab-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;
        color: #1e293b;
        text-align: left;
      }

      .gestalt-fab-item:hover {
        background: #f1f5f9;
      }

      .gestalt-fab-item svg {
        flex-shrink: 0;
        color: #667eea;
      }

      /* Toast 通知 */
      .gestalt-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        background: #1e293b;
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 13px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 999999;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 350px;
      }

      .gestalt-toast.gestalt-toast-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .gestalt-toast.gestalt-toast-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }

      .gestalt-toast.gestalt-toast-error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }

      /* 恢复按钮 */
      #gestalt-restore-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999998;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      #gestalt-restore-button.gestalt-restore-visible {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }

      #gestalt-restore-button:hover {
        transform: scale(1.1);
      }

      /* 拖拽时的样式 */
      #gestalt-floating-button.gestalt-fab-dragging {
        opacity: 0.9;
        cursor: grabbing !important;
        transition: none;
      }

      #gestalt-floating-button.gestalt-fab-dragging .gestalt-fab-content {
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.6);
      }

      @media (prefers-color-scheme: dark) {
        .gestalt-fab-menu {
          background: #1e293b;
        }

        .gestalt-fab-item {
          color: #f1f5f9;
        }

        .gestalt-fab-item:hover {
          background: #334155;
        }
      }
    `
  }

  // 绑定浮动按钮事件
  function bindFloatingButtonEvents() {
    const fabContent = floatingButton.querySelector('.gestalt-fab-content')
    let clickCount = 0
    let clickTimer = null

    // 单击：优化输入框内容并替换
    fabContent.addEventListener('click', (e) => {
      e.stopPropagation()
      clickCount++

      if (clickCount === 1) {
        // 第一次点击，启动定时器等待可能的第二次点击
        clickTimer = setTimeout(() => {
          clickCount = 0
          // 单击：执行快速优化
          quickOptimizeAndReplace()
        }, 400) // 400ms 内没有第二次点击就算单击
      } else if (clickCount === 2) {
        // 第二次点击，清除单击定时器
        clearTimeout(clickTimer)
        clickCount = 0
        // 双击：打开侧边栏
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
        showToast('✨ 打开完整面板')
      }
    })

    // 右键单击：显示操作菜单
    fabContent.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      showFabMenu()
    })

    // 拖拽功能
    makeDraggable(floatingButton)
  }

  // 显示浮动按钮菜单
  function showFabMenu() {
    // 先移除已存在的菜单
    const existingMenu = document.querySelector('.gestalt-fab-menu')
    if (existingMenu) {
      existingMenu.remove()
    }

    const menu = document.createElement('div')
    menu.className = 'gestalt-fab-menu'
    menu.innerHTML = `
      <button class="gestalt-fab-item" data-action="optimize">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        <span>优化输入框内容</span>
      </button>
      <button class="gestalt-fab-item" data-action="full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
        <span>打开完整面板</span>
      </button>
      <button class="gestalt-fab-item" data-action="hide">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
        <span>隐藏按钮</span>
      </button>
    `

    floatingButton.appendChild(menu)

    // 强制重绘
    menu.offsetHeight
    menu.classList.add('gestalt-fab-menu-visible')

    // 绑定菜单项点击事件
    menu.querySelectorAll('.gestalt-fab-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        const action = item.dataset.action

        menu.classList.remove('gestalt-fab-menu-visible')
        setTimeout(() => menu.remove(), 200)

        switch (action) {
          case 'optimize':
            quickOptimizeAndReplace()
            break
          case 'full':
            chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
            showToast('✨ 打开完整面板')
            break
          case 'hide':
            hideFloatingButton()
            break
        }
      })
    })

    // 点击其他地方关闭菜单
    setTimeout(() => {
      document.addEventListener('click', closeFabMenu)
    }, 0)
  }

  function closeFabMenu() {
    const menu = document.querySelector('.gestalt-fab-menu')
    if (menu) {
      menu.classList.remove('gestalt-fab-menu-visible')
      setTimeout(() => menu.remove(), 200)
    }
    document.removeEventListener('click', closeFabMenu)
  }

  // 快速优化并替换输入框内容
  async function quickOptimizeAndReplace() {
    if (!currentPlatform) {
      showToast('❌ 不支持当前平台', 'error')
      return
    }

    const inputElement = findInputElement(currentPlatform)
    if (!inputElement) {
      showToast('❌ 找不到输入框', 'error')
      return
    }

    const originalText = getInputValue(inputElement)
    if (!originalText || originalText.trim().length === 0) {
      showToast('⚠️ 请先在输入框输入内容', 'warning')
      return
    }

    // 显示正在优化（智能识别中）
    showToast('✨ 正在分析内容类型并优化...')

    try {
      // 发送优化请求到 background
      const response = await chrome.runtime.sendMessage({
        type: 'QUICK_OPTIMIZE',
        text: originalText,
        platform: currentPlatform.key
      })

      if (response?.success && response?.optimizedText) {
        const optimizedText = response.optimizedText
        const detectedMode = response.detectedMode || 'text'
        const modeName = response.modeName || '文本'

        // 显示识别结果
        console.log('[Gestalt] 识别结果:', detectedMode, modeName)
        showToast(`🎯 识别为：${modeName}模式，正在优化...`)

        // 替换输入框内容
        await setInputElementValue(inputElement, optimizedText)
        triggerInputEvents(inputElement)

        // 验证是否成功设置
        const verifyText = getInputValue(inputElement)

        if (verifyText.includes(optimizedText.substring(0, 20))) {
          // 成功
          showToast(`✅ 已优化并替换 (${modeName}模式)`)
        } else {
          // 直接设置失败，尝试通过剪贴板粘贴
          showToast('⚠️ 正在尝试备用方案...')
          await copyToClipboard(optimizedText)

          // 模拟 Ctrl+V 粘贴
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer()
          })
          pasteEvent.clipboardData.setData('text/plain', optimizedText)
          inputElement.dispatchEvent(pasteEvent)

          // 再次检查
          const retryText = getInputValue(inputElement)
          if (retryText.includes(optimizedText.substring(0, 20))) {
            showToast(`✅ 已优化并粘贴 (${modeName}模式)`)
          } else {
            // 最后尝试：清空输入框并重新设置
            inputElement.value = ''
            await sleep(50)
            await setInputElementValue(inputElement, optimizedText)
            triggerInputEvents(inputElement)

            const finalText = getInputValue(inputElement)
            if (finalText.includes(optimizedText.substring(0, 20))) {
              showToast(`✅ 已优化并替换 (${modeName}模式)`)
            } else {
              // 全部失败，提示用户手动粘贴
              showToast(`⚠️ 已复制到剪贴板，请手动粘贴 (${modeName}模式)`, 'warning')
            }
          }
        }
      } else {
        showToast('❌ 优化失败: ' + (response?.error || '未知错误'), 'error')
      }
    } catch (error) {
      console.error('[Gestalt] 快速优化失败:', error)
      showToast('❌ 优化失败', 'error')
    }
  }

  // 处理浮动按钮操作
  function handleFabAction(action) {
    switch (action) {
      case 'open-sidebar':
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
        break
      case 'quick-save':
        quickSavePrompt()
        break
      case 'quick-insert':
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
        break
      case 'hide':
        hideFloatingButton()
        break
    }
  }

  // 快速保存提示词
  function quickSavePrompt() {
    const selection = window.getSelection()?.toString().trim()
    const inputElement = findInputElement(currentPlatform)

    let textToSave = selection || (inputElement ? getInputValue(inputElement) : '')

    if (textToSave) {
      chrome.runtime.sendMessage({
        type: 'SAVE_PROMPT_QUICK',
        content: textToSave,
        platform: currentPlatform.key
      }, (response) => {
        if (response?.success) {
          showToast('✅ 提示词已保存到库', 'success')
        } else {
          showToast('❌ 保存失败', 'error')
        }
      })
    } else {
      showToast('⚠️ 请先选择或输入要保存的文本', 'error')
    }
  }

  // 隐藏浮动按钮
  function hideFloatingButton() {
    floatingButton.classList.add('gestalt-fab-hidden')
    isButtonVisible = false

    // 创建恢复按钮
    createRestoreButton()
  }

  // 创建恢复按钮
  function createRestoreButton() {
    const restoreBtn = document.createElement('div')
    restoreBtn.id = 'gestalt-restore-button'
    restoreBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    `
    document.body.appendChild(restoreBtn)

    restoreBtn.addEventListener('click', () => {
      floatingButton.classList.remove('gestalt-fab-hidden')
      isButtonVisible = true
      restoreBtn.remove()
    })

    setTimeout(() => {
      restoreBtn.classList.add('gestalt-restore-visible')
    }, 100)
  }

  // 使元素可拖拽
  function makeDraggable(element) {
    let isDragging = false
    let startX, startY, initialX, initialY
    let dragTimeout = null

    const fabContent = element.querySelector('.gestalt-fab-content')

    // 拖拽开始
    fabContent.addEventListener('mousedown', (e) => {
      // 如果是点击事件，不处理
      if (e.button !== 0) return

      // 显示拖拽提示
      fabContent.style.cursor = 'grabbing'

      // 长按300ms后开始拖拽
      dragTimeout = setTimeout(() => {
        isDragging = true
        startX = e.clientX
        startY = e.clientY
        const rect = element.getBoundingClientRect()
        initialX = rect.left
        initialY = rect.top

        // 添加拖拽中的样式
        element.classList.add('gestalt-fab-dragging')
        fabContent.style.transform = 'scale(1.1)'

        e.preventDefault()
      }, 300)
    })

    // 取消拖拽（如果用户只是点击）
    fabContent.addEventListener('click', (e) => {
      if (dragTimeout) {
        clearTimeout(dragTimeout)
        dragTimeout = null
      }
      fabContent.style.cursor = 'pointer'
    })

    // 移动过程中
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return

      const dx = e.clientX - startX
      const dy = e.clientY - startY

      element.style.left = `${initialX + dx}px`
      element.style.top = `${initialY + dy}px`
      element.style.right = 'auto'
      element.style.bottom = 'auto'

      // 边界检查（防止拖出屏幕）
      const elementRect = element.getBoundingClientRect()
      if (elementRect.left < 0) {
        element.style.left = '0px'
      }
      if (elementRect.top < 0) {
        element.style.top = '0px'
      }
      if (elementRect.right > window.innerWidth) {
        element.style.left = `${window.innerWidth - elementRect.width}px`
      }
      if (elementRect.bottom > window.innerHeight) {
        element.style.top = `${window.innerHeight - elementRect.height}px`
      }
    })

    // 拖拽结束
    document.addEventListener('mouseup', () => {
      if (dragTimeout) {
        clearTimeout(dragTimeout)
        dragTimeout = null
      }

      if (isDragging) {
        isDragging = false
        element.classList.remove('gestalt-fab-dragging')
        fabContent.style.transform = ''
        fabContent.style.cursor = 'pointer'

        // 保存位置到 localStorage
        saveButtonPosition(element)
      }
    })
  }

  // 保存按钮位置
  function saveButtonPosition(element) {
    try {
      const rect = element.getBoundingClientRect()
      chrome.storage.local.set({
        gestaltFabPosition: {
          left: rect.left,
          top: rect.top
        }
      })
    } catch (e) {
      // 忽略错误
    }
  }

  // 加载保存的按钮位置
  function loadButtonPosition(element) {
    try {
      chrome.storage.local.get(['gestaltFabPosition'], (result) => {
        if (result.gestaltFabPosition) {
          element.style.left = result.gestaltFabPosition.left + 'px'
          element.style.top = result.gestaltFabPosition.top + 'px'
          element.style.right = 'auto'
          element.style.bottom = 'auto'
        }
      })
    } catch (e) {
      // 忽略错误
    }
  }

  // 监听页面变化
  function observePageChanges() {
    const observer = new MutationObserver(() => {
      // 检查浮动按钮是否被移除
      if (isButtonVisible && !document.contains(floatingButton)) {
        createFloatingButton()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // 处理消息
  function handleMessage(message, sender, sendResponse) {
    console.log('[Gestalt Content] 收到消息:', message.type)

    switch (message.type) {
      case 'INSERT_PROMPT':
        insertPromptWithRetry(message.prompt, currentPlatform)
          .then(success => {
            sendResponse({ success })
            if (success) {
              showToast('✅ 提示词已插入', 'success')
            } else {
              showToast('❌ 插入失败，已复制到剪贴板', 'error')
            }
          })
        return true

      case 'GET_PAGE_CONTEXT':
        const context = getPageContext()
        sendResponse({ context })
        break

      case 'GET_CONVERSATION_HISTORY':
        // 获取当前AI平台的对话历史
        const history = getConversationHistory()
        sendResponse({ history, platform: currentPlatform?.key })
        break

      case 'TOGGLE_FLOATING_BUTTON':
        if (isButtonVisible) {
          hideFloatingButton()
        } else {
          floatingButton?.classList.remove('gestalt-fab-hidden')
          isButtonVisible = true
        }
        sendResponse({ success: true })
        break

      case 'GET_SELECTED_TEXT':
        const selectedText = window.getSelection()?.toString()?.trim() || ''
        sendResponse({ text: selectedText })
        break

      case 'QUICK_OPTIMIZE_SELECTION':
        const selection = window.getSelection()?.toString()?.trim()
        if (selection) {
          // 打开快速优化面板并预填充选中的文本
          chrome.runtime.sendMessage({
            type: 'OPEN_QUICK_OPTIMIZE',
            text: selection
          })
          sendResponse({ success: true })
        } else {
          sendResponse({ success: false, error: '没有选中的文本' })
        }
        break

      default:
        sendResponse({ error: 'Unknown message' })
    }

    return true
  }

  // 带重试的插入功能
  async function insertPromptWithRetry(prompt, platform, retryCount = 0) {
    console.log(`[Gestalt] 尝试插入提示词 (${retryCount + 1}/${CONFIG.maxRetries})`)

    try {
      const inputElement = await findInputElementAsync(platform)
      if (!inputElement) {
        throw new Error('找不到输入框')
      }

      // 聚焦输入框
      focusInputElement(inputElement)

      // 方法1: 直接设置值
      await setInputElementValue(inputElement, prompt)
      triggerInputEvents(inputElement)

      // 等待验证
      await sleep(100)

      let currentValue = getInputValue(inputElement)
      if (currentValue.includes(prompt.substring(0, 30))) {
        return true
      }

      // 方法2: 尝试通过 selection API 和 execCommand
      if (document.queryCommandSupported('insertText')) {
        document.execCommand('insertText', false, prompt)
        await sleep(100)
        currentValue = getInputValue(inputElement)
        if (currentValue.includes(prompt.substring(0, 30))) {
          return true
        }
      }

      // 方法3: 尝试通过 Clipboard API
      try {
        await navigator.clipboard.writeText(prompt)
        inputElement.focus()
        // 尝试不同的粘贴方式
        const pasteSuccess = inputElement.dispatchEvent(
          new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer()
          })
        )
        if (!pasteSuccess) {
          // 如果 paste 事件被阻止，尝试使用 execCommand
          document.execCommand('paste')
        }
        await sleep(100)

        currentValue = getInputValue(inputElement)
        if (currentValue.includes(prompt.substring(0, 30))) {
          return true
        }
      } catch (clipboardError) {
        console.log('[Gestalt] 剪贴板方式失败:', clipboardError)
      }

      // 方法4: 重新清空并设置（针对某些框架）
      inputElement.value = ''
      inputElement.focus()
      await sleep(50)
      await setInputElementValue(inputElement, prompt)
      triggerInputEvents(inputElement)
      await sleep(100)

      currentValue = getInputValue(inputElement)
      if (currentValue.includes(prompt.substring(0, 30))) {
        return true
      }

      // 如果重试次数还没用完
      if (retryCount < CONFIG.maxRetries) {
        await sleep(CONFIG.retryDelay)
        return insertPromptWithRetry(prompt, platform, retryCount + 1)
      }

      // 所有方法都失败，复制到剪贴板并提示用户
      await copyToClipboard(prompt)
      return false

    } catch (error) {
      console.error('[Gestalt] 插入错误:', error)

      // 最后尝试复制到剪贴板
      await copyToClipboard(prompt)
      return false
    }
  }

  // 异步查找输入框
  function findInputElementAsync(platform) {
    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = 10

      const tryFind = () => {
        const element = findInputElement(platform)
        if (element) {
          resolve(element)
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(tryFind, 200)
        } else {
          resolve(null)
        }
      }

      tryFind()
    })
  }

  // 查找输入框
  function findInputElement(platform) {
    if (!platform) return null

    // 首先尝试平台特定的选择器
    for (const selector of platform.input) {
      try {
        const element = document.querySelector(selector)
        if (element && isElementVisible(element)) {
          console.log('[Gestalt] 找到输入框:', selector)
          return element
        }
      } catch (e) {
        // 选择器可能无效，继续尝试下一个
        continue
      }
    }

    // 如果特定选择器没找到，尝试通用的AI输入框选择器
    const genericSelectors = [
      'textarea[placeholder*="ai" i]',
      'textarea[placeholder*="chat" i]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="问题" i]',
      'textarea[placeholder*="搜索" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[aria-label*="chat" i]',
      'textarea[aria-label*="message" i]',
      'div[contenteditable="true"][aria-label*="chat" i]',
      'div[contenteditable="true"][role="textbox"]',
      'form textarea',
      'main textarea',
      '#prompt-textarea'
    ]

    for (const selector of genericSelectors) {
      try {
        const element = document.querySelector(selector)
        if (element && isElementVisible(element)) {
          console.log('[Gestalt] 找到通用输入框:', selector)
          return element
        }
      } catch (e) {
        continue
      }
    }

    // 最后尝试页面中最大的可见textarea
    const textareas = document.querySelectorAll('textarea')
    let largestTextarea = null
    let largestSize = 0

    textareas.forEach(textarea => {
      if (isElementVisible(textarea)) {
        const size = textarea.offsetWidth * textarea.offsetHeight
        if (size > largestSize) {
          largestSize = size
          largestTextarea = textarea
        }
      }
    })

    if (largestTextarea && largestSize > 10000) { // 至少10x10像素
      console.log('[Gestalt] 找到最大textarea')
      return largestTextarea
    }

    return null
  }

  // 检查元素是否可见
  function isElementVisible(element) {
    if (!element) return false
    const style = window.getComputedStyle(element)
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetParent !== null
  }

  // 聚焦输入框
  function focusInputElement(element) {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 设置输入框值
  async function setInputElementValue(element, value) {
    // 先聚焦元素
    element.focus()

    if (element.getAttribute('contenteditable') === 'true') {
      // ContentEditable 元素
      element.textContent = value
      element.scrollTop = element.scrollHeight
    } else {
      // 普通 input/textarea
      element.value = value

      // 豆包等国产平台可能使用特殊框架，需要额外处理
      // 尝试触发原生 setter
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype, 'value'
        )?.set
        if (nativeSetter) {
          nativeSetter.call(element, value)
        }
      } catch (e) {
        // 忽略错误
      }

      // 尝试查找父级框架的输入处理
      let parent = element.parentElement
      for (let i = 0; i < 5 && parent; i++) {
        // 尝试触发 React/Vue/Angular 的合成事件
        const reactId = parent.getAttribute?.('data-reactroot') ||
                        parent.getAttribute?.('data-owns') ||
                        parent.getAttribute?.('data-ce-key')

        if (reactId || parent.tagName === 'FORM') {
          // 尝试触发父表单的输入事件
          parent.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
          parent.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
        }
        parent = parent.parentElement
      }
    }
  }

  // 获取输入框值
  function getInputValue(element) {
    if (element.getAttribute('contenteditable') === 'true') {
      return element.textContent || ''
    }
    return element.value || ''
  }

  // 触发输入事件
  function triggerInputEvents(element) {
    // 只触发输入事件，不触发Enter键（避免自动发送）
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new Event('blur', { bubbles: true, cancelable: true }),
      new InputEvent('input', { bubbles: true, cancelable: true, data: element.value })
    ]

    events.forEach(event => {
      try {
        element.dispatchEvent(event)
      } catch (e) {
        // 忽略事件触发错误
      }
    })

    // 触发 React/Vue 的更新
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set

    if (nativeInputValueSetter && element.tagName === 'TEXTAREA') {
      try {
        nativeInputValueSetter.call(element, element.value)
      } catch (e) {
        // 忽略错误
      }
    }

    // 再次触发 input 事件以确保框架更新
    element.dispatchEvent(new Event('input', { bubbles: true }))

    // 针对豆包等国产平台，尝试模拟用户输入
    // 尝试通过 selection API 触发
    try {
      const start = element.value.length
      element.setSelectionRange(start, start)
    } catch (e) {
      // 忽略错误
    }

    // 尝试触发 keydown/keyup 事件
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', keyCode: 65 }))
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a', keyCode: 65 }))

    // 尝试触发 composition 事件（中文输入需要）
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
  }

  // 复制到剪贴板
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      console.log('[Gestalt] 已复制到剪贴板')
    } catch (err) {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  // 获取页面上下文
  function getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      platform: currentPlatform?.key,
      selection: window.getSelection()?.toString() || '',
      userInput: getInputValue(findInputElement(currentPlatform))
    }
  }

  // 获取AI平台的对话历史
  function getConversationHistory() {
    if (!currentPlatform) return []

    const messages = []
    const selectors = PLATFORM_SELECTORS[currentPlatform?.key]

    if (!selectors) return []

    // 尝试多种方式获取对话
    try {
      // 方法1: 使用平台特定的CSS选择器
      const userSelectors = selectors.userMessage || selectors.conversation
      const assistantSelectors = selectors.assistantMessage || selectors.conversation

      // 获取用户消息
      for (const selector of userSelectors) {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          const text = el.textContent?.trim()
          if (text && text.length > 2 && text.length < 10000) {
            // 避免重复
            if (!messages.some(m => m.content === text && m.role === 'user')) {
              messages.push({ role: 'user', content: text })
            }
          }
        })
      }

      // 获取AI回复
      for (const selector of assistantSelectors) {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          const text = el.textContent?.trim()
          if (text && text.length > 2 && text.length < 50000) {
            // 避免重复
            if (!messages.some(m => m.content === text && m.role === 'assistant')) {
              messages.push({ role: 'assistant', content: text })
            }
          }
        })
      }

      // 按DOM顺序排序
      const allElements = document.querySelectorAll(selectors.conversation.join(','))
      const sortedMessages = []
      allElements.forEach(el => {
        const text = el.textContent?.trim()
        if (!text || text.length < 2) return

        // 判断是用户还是AI
        const isUser = el.matches(selectors.userMessage?.join(',')) ||
                       el.closest(selectors.userMessage?.join(',')) ||
                       el.getAttribute('data-message-author-role') === 'user' ||
                       el.getAttribute('data-role') === 'user' ||
                       el.classList?.contains('user')

        const role = isUser ? 'user' : 'assistant'

        if (!sortedMessages.some(m => m.content === text)) {
          sortedMessages.push({ role, content: text })
        }
      })

      return sortedMessages.slice(-20) // 最多返回最近20条

    } catch (e) {
      console.log('[Gestalt] 获取对话历史失败:', e)
      return []
    }
  }

  // 显示 Toast 通知
  function showToast(message, type = 'success') {
    // 移除已存在的 toast
    const existingToast = document.querySelector('.gestalt-toast')
    if (existingToast) {
      existingToast.remove()
    }

    const toast = document.createElement('div')
    toast.className = `gestalt-toast gestalt-toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)

    // 强制重绘以触发动画
    toast.offsetHeight

    setTimeout(() => {
      toast.classList.add('gestalt-toast-visible')
    }, 10)

    setTimeout(() => {
      toast.classList.remove('gestalt-toast-visible')
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  // 工具函数
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  // 监听 URL 变化（SPA）
  let lastUrl = window.location.href
  new MutationObserver(() => {
    const currentUrl = window.location.href
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      console.log('[Gestalt] URL 已变化，重新检测平台')
      currentPlatform = detectPlatform()
    }
  }).observe(document.body, { childList: true, subtree: true })

})()
