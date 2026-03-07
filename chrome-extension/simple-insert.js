// ==========================================
// Gestalt - 增强版插入功能
// 支持更多平台，更可靠的插入机制
// ==========================================

(function() {
  'use strict'

  console.log('[Gestalt Insert] 增强插入模块已加载')

  // 平台配置 - 包含所有主流AI平台的精确选择器
  const PLATFORMS = {
    chatgpt: {
      name: 'ChatGPT',
      urlPatterns: ['chatgpt.com', 'chat.openai.com'],
      inputSelectors: [
        // 最新 ChatGPT 选择器
        '#prompt-textarea',
        'textarea[data-id^="prompt-textarea"]',
        'textarea[id="prompt-textarea"]',
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="Message"]',
        // 备选
        'textarea[aria-label*="message" i]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"][data-placeholder*="message" i]'
      ],
      inputType: 'textarea'
    },
    claude: {
      name: 'Claude',
      urlPatterns: ['claude.ai'],
      inputSelectors: [
        // Claude 选择器
        'div[contenteditable="true"][data-value]',
        'div[contenteditable="true"][data-placeholder*="message" i]',
        'div[contenteditable="true"][aria-label*="message" i]',
        'div[contenteditable="true"][role="textbox"]',
        // 备选
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="发送消息"]'
      ],
      inputType: 'contenteditable'
    },
    gemini: {
      name: 'Gemini',
      urlPatterns: ['gemini.google.com'],
      inputSelectors: [
        // Gemini 选择器
        'rich-textarea div[contenteditable="true"]',
        'rich-textarea textarea',
        'textarea[placeholder*="Enter"]',
        'textarea[placeholder*="输入"]',
        'div[contenteditable="true"][data-placeholder*="Enter" i]',
        'div[contenteditable="true"][aria-label*="message" i]'
      ],
      inputType: 'auto'
    },
    deepseek: {
      name: 'DeepSeek',
      urlPatterns: ['deepseek.com', 'chat.deepseek.com'],
      inputSelectors: [
        // DeepSeek 选择器
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="Enter"]',
        'textarea[aria-label*="message" i]',
        'div[contenteditable="true"]',
        'div[contenteditable="true"][role="textbox"]'
      ],
      inputType: 'textarea'
    },
    perplexity: {
      name: 'Perplexity',
      urlPatterns: ['perplexity.ai', 'www.perplexity.ai'],
      inputSelectors: [
        // Perplexity 选择器
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Search"]',
        'textarea[aria-label*="Search" i]',
        'div[contenteditable="true"][data-placeholder*="Ask" i]',
        'div[contenteditable="true"]'
      ],
      inputType: 'textarea'
    },
    kimi: {
      name: 'Kimi',
      urlPatterns: ['kimi.moonshot.cn', 'kimi.kimim.ai'],
      inputSelectors: [
        // Kimi 选择器
        'textarea[placeholder*="发送消息"]',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="Message"]',
        'div[contenteditable="true"][placeholder*="发送消息"]',
        'div[contenteditable="true"][role="textbox"]'
      ],
      inputType: 'textarea'
    },
    yiyan: {
      name: '文心一言',
      urlPatterns: ['yiyan.baidu.com'],
      inputSelectors: [
        // 文心一言选择器
        'textarea[placeholder*="请输入"]',
        'textarea[placeholder*="发送"]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"][placeholder*="请输入"]'
      ],
      inputType: 'textarea'
    },
    tongyi: {
      name: '通义千问',
      urlPatterns: ['tongyi.aliyun.com', 'tongyi.alii.ai'],
      inputSelectors: [
        // 通义千问选择器
        'textarea[placeholder*="请输入"]',
        'textarea[placeholder*="发送"]',
        'textarea[placeholder*="输入"]',
        'div[contenteditable="true"][role="textbox"]'
      ],
      inputType: 'textarea'
    },
    copilot: {
      name: 'Copilot',
      urlPatterns: ['copilot.microsoft.com', 'www.bing.com'],
      inputSelectors: [
        // Copilot 选择器
        'textarea[placeholder*="Ask me anything"]',
        'textarea[placeholder*="发送消息"]',
        'div[contenteditable="true"][aria-label*="prompt" i]',
        'div[contenteditable="true"][role="textbox"]'
      ],
      inputType: 'auto'
    }
  }

  // 平台检测缓存
  const platformDetectionCache = new Map()

  // 检测当前平台（带缓存）
  function detectPlatform() {
    const url = window.location.href

    // 检查缓存
    if (platformDetectionCache.has(url)) {
      return platformDetectionCache.get(url)
    }

    for (const [key, platform] of Object.entries(PLATFORMS)) {
      for (const pattern of platform.urlPatterns) {
        if (url.includes(pattern)) {
          console.log('[Gestalt Insert] 检测到平台:', platform.name)
          const result = { key, ...platform }
          // 缓存结果
          platformDetectionCache.set(url, result)
          return result
        }
      }
    }

    return null
  }

  // 查找输入框
  function findInputElement(platform) {
    if (!platform) {
      // 如果无法识别平台，尝试查找所有可能的输入框
      return findAnyInputElement()
    }

    for (const selector of platform.inputSelectors) {
      try {
        const element = document.querySelector(selector)
        if (element && isVisible(element)) {
          console.log('[Gestalt Insert] 找到输入框:', selector)
          return { element, selector }
        }
      } catch (e) {
        continue
      }
    }

    // 尝试备选方案
    return findAnyInputElement()
  }

  // 查找任意输入框
  function findAnyInputElement() {
    // 查找所有可能的输入元素
    const candidates = [
      // 优先级1: 大型textarea
      'textarea:not([readonly]):not([disabled])',
      // 优先级2: contenteditablediv
      'div[contenteditable="true"]:not([aria-hidden="true"])',
      // 优先级3: 输入框
      'input[type="text"]:not([readonly]):not([disabled])'
    ]

    for (const selector of candidates) {
      const elements = document.querySelectorAll(selector)
      for (const el of elements) {
        if (isVisible(el) && isLikelyInput(el)) {
          console.log('[Gestalt Insert] 找到输入元素:', el.tagName, el.className?.substring(0, 30))
          return { element: el, selector }
        }
      }
    }

    return null
  }

  // 判断元素是否可能是输入框
  function isLikelyInput(el) {
    const rect = el.getBoundingClientRect()
    // 检查是否有足够的尺寸
    if (rect.width < 100 || rect.height < 30) return false

    // 检查是否在视口内
    if (rect.top > window.innerHeight || rect.bottom < 0) return false

    // 检查是否有文本相关的属性或占位符
    const placeholder = el.getAttribute('placeholder') || ''
    const ariaLabel = el.getAttribute('aria-label') || ''

    return placeholder.length > 0 || ariaLabel.length > 0 || el.tagName === 'TEXTAREA'
  }

  // 检查元素是否可见
  function isVisible(el) {
    if (!el) return false
    const style = window.getComputedStyle(el)
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           el.offsetParent !== null
  }

  // 核心插入函数
  async function insertPrompt(text) {
    console.log('[Gestalt Insert] 开始插入，文本长度:', text?.length)

    if (!text) {
      return { success: false, error: '没有文本' }
    }

    const platform = detectPlatform()
    const inputResult = findInputElement(platform)

    if (!inputResult) {
      console.log('[Gestalt Insert] 未找到输入框，尝试复制到剪贴板')
      return await fallbackToClipboard(text)
    }

    const { element } = inputResult

    // 根据元素类型选择插入方法
    let success = false

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      success = await insertIntoInput(element, text)
    } else if (element.getAttribute('contenteditable') === 'true') {
      success = await insertIntoContentEditable(element, text)
    } else {
      // 尝试当作 textarea 处理
      success = await insertIntoInput(element, text)
    }

    if (success) {
      showNotification('✅ 已插入到 ' + (platform?.name || '对话框'), 'success')
      return { success: true, platform: platform?.name || 'unknown' }
    }

    // 失败，复制到剪贴板
    return await fallbackToClipboard(text)
  }

  // 插入到 textarea/input
  async function insertIntoInput(el, text) {
    console.log('[Gestalt Insert] 插入到 input/textarea')

    try {
      // 方法1: 直接设置值
      el.value = text
      triggerEvents(el)

      await sleep(50)

      if (el.value.includes(text.substring(0, 20))) {
        console.log('[Gestalt Insert] 方法1成功: 直接设置值')
        return true
      }

      // 方法2: 使用原生 setter (绕过框架拦截)
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
      )?.set

      if (nativeSetter) {
        nativeSetter.call(el, text)
        triggerEvents(el)

        await sleep(50)

        if (el.value.includes(text.substring(0, 20))) {
          console.log('[Gestalt Insert] 方法2成功: 原生setter')
          return true
        }
      }

      // 方法3: 模拟用户输入
      el.focus()
      // 清空
      el.value = ''
      triggerEvents(el)

      await sleep(30)

      // 分段插入（模拟打字）
      const chunkSize = 500
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.substring(i, i + chunkSize)
        el.value += chunk
        triggerEvents(el)
        await sleep(10)
      }

      if (el.value.includes(text.substring(0, 20))) {
        console.log('[Gestalt Insert] 方法3成功: 模拟打字')
        return true
      }

    } catch (e) {
      console.log('[Gestalt Insert] 插入错误:', e)
    }

    return false
  }

  // 插入到 contenteditable
  async function insertIntoContentEditable(el, text) {
    console.log('[Gestalt Insert] 插入到 contentEditable')

    try {
      el.focus()

      // 方法1: 清空并设置
      el.textContent = ''
      el.appendChild(document.createTextNode(text))
      triggerEvents(el)

      await sleep(50)

      if (el.textContent.includes(text.substring(0, 20))) {
        console.log('[Gestalt Insert] contentEditable 方法1成功')
        return true
      }

      // 方法2: 使用 document.execCommand
      el.textContent = ''
      document.execCommand('insertText', false, text)
      triggerEvents(el)

      await sleep(50)

      if (el.textContent.includes(text.substring(0, 20))) {
        console.log('[Gestalt Insert] contentEditable 方法2成功')
        return true
      }

      // 方法3: 使用 Selection API
      el.textContent = ''
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)

      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const textNode = document.createTextNode(text)
      range.insertNode(textNode)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)

      triggerEvents(el)

      await sleep(50)

      if (el.textContent.includes(text.substring(0, 20))) {
        console.log('[Gestalt Insert] contentEditable 方法3成功')
        return true
      }

    } catch (e) {
      console.log('[Gestalt Insert] contentEditable 错误:', e)
    }

    return false
  }

  // 触发事件
  function triggerEvents(el) {
    // 基础事件
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
    el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }))

    // 键盘事件
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', ctrlKey: true }))
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))

    // InputEvent (React/Vue)
    try {
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: el.value
      })
      el.dispatchEvent(inputEvent)
    } catch (e) {
      // 某些浏览器不支持 InputEvent
    }
  }

  // 降级到剪贴板
  async function fallbackToClipboard(text) {
    console.log('[Gestalt Insert] 降级到剪贴板')

    try {
      await navigator.clipboard.writeText(text)
      showNotification('📋 已复制到剪贴板，请按 Ctrl+V 粘贴', 'warning')
      return { success: false, fallback: 'clipboard' }
    } catch (e) {
      // 降级方案
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        showNotification('📋 已复制到剪贴板，请按 Ctrl+V 粘贴', 'warning')
        return { success: false, fallback: 'clipboard' }
      } catch (e2) {
        showNotification('❌ 复制失败: ' + e.message, 'error')
        return { success: false, error: e.message }
      }
    }
  }

  // 睡眠
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 显示通知
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.gestalt-insert-notification')
    if (existing) existing.remove()

    const notification = document.createElement('div')
    notification.className = 'gestalt-insert-notification'

    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 14px 20px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      animation: gestaltSlideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'gestaltSlideOut 0.3s ease'
      setTimeout(() => notification.remove(), 300)
    }, 3500)
  }

  // 添加动画样式
  const style = document.createElement('style')
  style.textContent = `
    @keyframes gestaltSlideIn {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes gestaltSlideOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100px); }
    }
  `
  document.head.appendChild(style)

  // 监听消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Gestalt Insert] 收到消息:', message.type)

    if (message.type === 'INSERT_PROMPT') {
      console.log('[Gestalt Insert] 开始插入提示词')
      insertPrompt(message.prompt)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true
    }

    if (message.type === 'TEST_INSERT') {
      insertPrompt('Gestalt 测试插入 ' + new Date().toLocaleTimeString())
        .then(result => {
          console.log('[Gestalt Insert] 测试结果:', result)
          sendResponse(result)
        })
      return true
    }

    if (message.type === 'GET_PLATFORM') {
      const platform = detectPlatform()
      sendResponse({ platform: platform?.name || 'unknown' })
      return true
    }

    return false
  })

  console.log('[Gestalt Insert] 模块初始化完成')

  // 导出到全局
  window.gestaltInsert = insertPrompt
  window.gestaltDetectPlatform = detectPlatform
})()
