// ==========================================
// Gestalt 提示词插入功能 - 专注可靠插入
// ==========================================

(function() {
  'use strict'

  console.log('[Gestalt Inject] 插入模块已加载')

  // 调试模式
  const DEBUG = true

  function log(...args) {
    if (DEBUG) {
      console.log('[Gestalt Inject]', ...args)
    }
  }

  // 平台配置 - 更新2025年最新选择器
  const PLATFORMS = {
    chatgpt: {
      name: 'ChatGPT',
      prioritySelectors: [
        // 2025年最新选择器
        '#prompt-textarea',
        'textarea[data-id="request-:"]',
        'textarea[data-id="prompt-textarea"]',
        // 通用选择器
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="Send a message"]',
        // ContentEditable div
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"][role="textbox"]',
        // 最后的兜底
        'textarea:not([readonly])',
        'div[contenteditable="true"]:not([readonly])'
      ],
      sendButton: [
        'button[data-testid="send-button"]',
        'button[aria-label="Send message"]',
        'button[type="submit"]',
        'button:has(svg[data-icon="send"])'
      ],
      test: (text) => {
        // ChatGPT特定测试
        const textarea = document.querySelector('#prompt-textarea')
        if (textarea) {
          log('找到ChatGPT主输入框')
          return true
        }
        return false
      }
    },
    claude: {
      name: 'Claude',
      prioritySelectors: [
        // 2025年最新选择器
        'div[contenteditable="true"][data-value]',
        'div[contenteditable="true"][data-render="true"]',
        // 通用选择器
        'div[contenteditable="true"][placeholder*="Message"]',
        'div[contenteditable="true"][placeholder*="发送消息"]',
        // Textarea（备用）
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="发送消息"]',
        // 兜底
        'div[contenteditable="true"]:not([readonly])'
      ],
      sendButton: [
        'button[aria-label="Send message"]',
        'button[type="submit"]',
        'button:has(svg):not([disabled])'
      ],
      test: (text) => {
        const ce = document.querySelector('div[contenteditable="true"][data-value]')
        if (ce) {
          log('找到Claude输入框')
          return true
        }
        return false
      }
    },
    gemini: {
      name: 'Gemini',
      prioritySelectors: [
        // 2025年最新选择器
        'rich-textarea div[contenteditable="true"]',
        'rich-textarea p[contenteditable="true"]',
        // 通用选择器
        'textarea[placeholder*="Enter"]',
        'textarea[placeholder*="输入"]',
        'div[contenteditable="true"]',
        // 兜底
        'textarea:not([readonly])'
      ],
      sendButton: [
        'button[aria-label="Send message"]',
        'button[type="submit"]'
      ],
      test: (text) => {
        const richTextarea = document.querySelector('rich-textarea')
        if (richTextarea) {
          log('找到Gemini rich-textarea')
          return true
        }
        return false
      }
    },
    deepseek: {
      name: 'DeepSeek',
      prioritySelectors: [
        // 2025年最新
        'textarea[placeholder*="输入消息"]',
        'textarea[placeholder*="Type"]',
        // ContentEditable
        'div[contenteditable="true"]',
        // 通用
        'textarea:not([readonly])'
      ],
      sendButton: [
        'button[type="submit"]',
        'button[aria-label="Send"]'
      ],
      test: (text) => {
        return document.querySelector('textarea') !== null
      }
    }
  }

  // 检测当前平台
  function detectPlatform() {
    const url = window.location.href

    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
      return 'chatgpt'
    } else if (url.includes('claude.ai')) {
      return 'claude'
    } else if (url.includes('gemini.google.com')) {
      return 'gemini'
    } else if (url.includes('deepseek.com')) {
      return 'deepseek'
    }

    // 通用模式
    return 'generic'
  }

  // ==========================================
  // 核心插入功能
  // ==========================================

  async function insertText(text) {
    log('开始插入文本，长度:', text.length)

    const platform = detectPlatform()
    log('检测到平台:', platform)

    const platformConfig = PLATFORMS[platform] || PLATFORMS.chatgpt

    // 方法1: 尝试使用平台特定的选择器
    let result = await tryPlatformSpecificInsert(text, platformConfig)
    if (result.success) {
      log('平台特定插入成功')
      return result
    }

    // 方法2: 通用查找方法
    result = await tryGenericInsert(text)
    if (result.success) {
      log('通用插入成功')
      return result
    }

    // 方法3: 最后的尝试 - 查找所有可编辑元素
    result = await tryFindAnyEditable(text)
    if (result.success) {
      log('查找可编辑元素成功')
      return result
    }

    // 所有方法都失败
    log('所有插入方法都失败')
    return {
      success: false,
      error: '找不到可输入的文本框',
      fallback: 'copy'
    }
  }

  // 平台特定插入
  async function tryPlatformSpecificInsert(text, config) {
    log('尝试平台特定插入')

    for (const selector of config.prioritySelectors) {
      try {
        const element = document.querySelector(selector)
        if (element && isElementEditable(element)) {
          log('找到元素:', selector)

          const result = await insertToElement(element, text)
          if (result.success) {
            return result
          }
        }
      } catch (e) {
        log('选择器错误:', selector, e)
        continue
      }
    }

    return { success: false }
  }

  // 通用插入
  async function tryGenericInsert(text) {
    log('尝试通用插入')

    // 查找所有可能的输入元素
    const selectors = [
      'textarea:not([readonly])',
      'input[type="text"]:not([readonly])',
      'div[contenteditable="true"]:not([contenteditable="false"])',
      '[contenteditable="true"]'
    ]

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector)
      log('找到元素:', selector, elements.length, '个')

      for (const element of elements) {
        if (isElementVisible(element) && isElementEditable(element)) {
          log('尝试插入到:', element)

          const result = await insertToElement(element, text)
          if (result.success) {
            return result
          }
        }
      }
    }

    return { success: false }
  }

  // 查找任何可编辑元素
  async function tryFindAnyEditable(text) {
    log('查找任何可编辑元素')

    // 获取页面上所有元素
    const allElements = document.querySelectorAll('*')
    log('页面总元素数:', allElements.length)

    for (const element of allElements) {
      // 检查是否可编辑
      const isContentEditable = element.getAttribute('contenteditable') === 'true'
      const isTextArea = element.tagName === 'TEXTAREA'
      const isTextInput = element.tagName === 'INPUT' && element.type === 'text'

      if ((isContentEditable || isTextArea || isTextInput) &&
          isElementVisible(element)) {

        log('找到可编辑元素:', element.tagName, element.className)

        const result = await insertToElement(element, text)
        if (result.success) {
          return result
        }
      }
    }

    return { success: false }
  }

  // 插入到具体元素
  async function insertToElement(element, text) {
    log('插入到元素:', element.tagName, element.className)

    try {
      // 聚焦元素
      await focusElement(element)
      await sleep(100)

      // 根据元素类型选择插入方法
      if (element.getAttribute('contenteditable') === 'true') {
        return await insertToContentEditable(element, text)
      } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        return await insertToInput(element, text)
      }

      return { success: false }
    } catch (e) {
      log('插入错误:', e)
      return { success: false, error: e.message }
    }
  }

  // 插入到 ContentEditable
  async function insertToContentEditable(element, text) {
    log('插入到 ContentEditable')

    try {
      // 清空现有内容
      element.textContent = ''

      // 创建文本节点
      const textNode = document.createTextNode(text)
      element.appendChild(textNode)

      // 触发事件
      triggerEvents(element, 'input')

      // 设置光标到末尾
      setCaretToEnd(element)

      // 验证
      await sleep(50)
      const currentValue = element.textContent.trim()
      if (currentValue === text || currentValue.includes(text.substring(0, 50))) {
        log('ContentEditable 插入成功')
        return { success: true, method: 'contenteditable' }
      }

      log('ContentEditable 插入验证失败')
      return { success: false }
    } catch (e) {
      log('ContentEditable 插入错误:', e)
      return { success: false, error: e.message }
    }
  }

  // 插入到 Input/Textarea
  async function insertToInput(element, text) {
    log('插入到 Input/Textarea')

    try {
      // 方法1: 直接设置 value
      element.value = text

      // 触发事件
      triggerEvents(element, 'input')
      triggerEvents(element, 'change')

      // 验证
      await sleep(50)
      if (element.value === text || element.value.includes(text)) {
        log('直接设置 value 成功')
        return { success: true, method: 'value' }
      }

      // 方法2: 使用原生 setter
      const nativeSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(element),
        'value'
      )?.set

      if (nativeSetter) {
        nativeSetter.call(element, text)
        triggerEvents(element, 'input')
        triggerEvents(element, 'change')

        await sleep(50)
        if (element.value === text || element.value.includes(text)) {
          log('使用原生 setter 成功')
          return { success: true, method: 'native-setter' }
        }
      }

      // 方法3: 模拟用户输入
      element.focus()
      element.select()

      // 使用 execCommand (已废弃但仍然有效)
      const successful = document.execCommand('insertText', false, text)
      if (successful) {
        log('使用 execCommand 成功')
        return { success: true, method: 'execcommand' }
      }

      log('所有 Input 插入方法都失败')
      return { success: false }

    } catch (e) {
      log('Input 插入错误:', e)
      return { success: false, error: e.message }
    }
  }

  // ==========================================
  // 辅助函数
  // ==========================================

  function isElementEditable(element) {
    if (!element) return false

    // 检查 readonly 属性
    if (element.hasAttribute('readonly') && element.getAttribute('readonly') !== 'false') {
      return false
    }

    // 检查 disabled 属性
    if (element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false') {
      return false
    }

    // 检查 contenteditable
    if (element.getAttribute('contenteditable') === 'true') {
      return true
    }

    // 检查标签类型
    const tag = element.tagName
    if (tag === 'TEXTAREA' || tag === 'INPUT') {
      return true
    }

    return false
  }

  function isElementVisible(element) {
    if (!element) return false

    const style = window.getComputedStyle(element)
    if (style.display === 'none') return false
    if (style.visibility === 'hidden') return false
    if (style.opacity === '0') return false
    if (element.offsetParent === null) return false

    return true
  }

  async function focusElement(element) {
    try {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await sleep(100)
    } catch (e) {
      log('聚焦失败:', e)
    }
  }

  function setCaretToEnd(element) {
    try {
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(element)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    } catch (e) {
      log('设置光标失败:', e)
    }
  }

  function triggerEvents(element, eventType) {
    const events = [
      new Event(eventType, { bubbles: true, cancelable: true }),
      new InputEvent(eventType, { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    ]

    events.forEach(event => {
      element.dispatchEvent(event)
    })

    // 触发 React 的变更检测
    if (element._valueTracker) {
      element._valueTracker.setValue('')
    }

    // 触发 Vue 的更新
    if (element.__vue__) {
      element.__vue__.$forceUpdate()
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ==========================================
  // 消息监听
  // ==========================================

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      log('收到消息:', message.type)

      if (message.type === 'INSERT_PROMPT') {
        log('开始插入提示词，长度:', message.prompt?.length)

        insertText(message.prompt || '')
          .then((result) => {
            log('插入结果:', result)
            sendResponse(result)
          })
          .catch((error) => {
            log('插入错误:', error)
            sendResponse({ success: false, error: error.message })
          })

        return true // 异步响应
      }

      if (message.type === 'TEST_INSERT') {
        log('测试插入功能')
        testInsertFunction()
        sendResponse({ success: true })
        return true
      }

      return false
    })

    log('消息监听器已注册')
  }

  // 测试函数
  async function testInsertFunction() {
    log('========== 开始插入功能测试 ==========')

    const platform = detectPlatform()
    log('当前平台:', platform)

    const testText = 'Gestalt 插入测试 ' + new Date().toISOString()

    log('测试文本:', testText)
    log('文本长度:', testText.length)

    const result = await insertText(testText)

    log('========== 测试结果 ==========')
    log('成功:', result.success)
    log('方法:', result.method)
    log('错误:', result.error)

    if (result.success) {
      showTestNotification('✅ 插入测试成功！', 'success')
    } else {
      showTestNotification('❌ 插入测试失败: ' + (result.error || '未知错误'), 'error')
    }
  }

  function showTestNotification(message, type) {
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      animation: slideIn 0.3s ease;
    `
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease'
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }

  // 添加CSS动画
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `
  document.head.appendChild(style)

  log('[Gestalt Inject] 插入模块初始化完成')
})()
