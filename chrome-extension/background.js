// ==========================================
// Gestalt Chrome Extension - Background Service Worker
// 处理插件生命周期事件和消息传递
// ==========================================

// 监听来自 content script 和 side panel 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Gestalt Background] 收到消息:', message.type)

  switch (message.type) {
    case 'GET_CONFIG':
      // 从存储中获取配置
      chrome.storage.local.get(['gestaltConfig'], (result) => {
        sendResponse({ config: result.gestaltConfig || getDefaultConfig() })
      })
      return true // 异步响应

    case 'SAVE_CONFIG':
      // 保存配置到存储
      chrome.storage.local.set({ gestaltConfig: message.config }, () => {
        sendResponse({ success: true })
      })
      return true

    case 'GET_TERMINOLOGY':
      // 获取术语库（从编译后的代码中）
      sendResponse({ terminology: getTerminologyData() })
      return true

    case 'INJECT_PROMPT':
      // 将优化后的提示词注入到目标页面
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'INSERT_PROMPT',
          prompt: message.prompt
        })
      }
      sendResponse({ success: true })
      return true

    case 'SAVE_PROMPT':
      // 保存提示词到库
      console.log('[Gestalt Background] 收到保存请求:', message.prompt)
      savePrompt(message.prompt, (result) => {
        console.log('[Gestalt Background] 保存完成:', result)
        sendResponse(result)
      })
      return true

    case 'GET_PROMPTS':
      // 获取所有提示词
      chrome.storage.local.get(['gestaltPrompts'], (result) => {
        const prompts = result.gestaltPrompts || []
        sendResponse({ prompts: prompts.sort((a, b) => b.updatedAt - a.updatedAt) })
      })
      return true

    case 'DELETE_PROMPT':
      // 删除提示词
      deletePrompt(message.id, (result) => {
        sendResponse(result)
      })
      return true

    case 'UPDATE_PROMPT':
      // 更新提示词
      updatePrompt(message.prompt, (result) => {
        sendResponse(result)
      })
      return true

    case 'TOGGLE_FAVORITE':
      // 切换收藏状态
      toggleFavorite(message.id, (result) => {
        sendResponse(result)
      })
      return true

    case 'GENERATE_TAGS':
      // 使用 AI 生成标签
      generateTagsForPrompt(message.prompt, message.config, (result) => {
        sendResponse(result)
      })
      return true

    case 'SAVE_PROMPT_QUICK':
      // 快速保存提示词（从浮动按钮）
      quickSavePrompt(message.content, message.platform, (result) => {
        sendResponse(result)
      })
      return true

    case 'OPEN_SIDE_PANEL':
      // 打开侧边栏
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id })
        }
      })
      sendResponse({ success: true })
      return true

    case 'OPEN_QUICK_OPTIMIZE':
      // 打开快速优化面板（通过打开弹出窗口）
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          // 打开弹出窗口
          chrome.action.openPopup()
        }
      })
      sendResponse({ success: true })
      return true

    case 'QUICK_OPTIMIZE':
      // 快速优化输入框内容
      quickOptimizeText(message.text, message.platform, (result) => {
        sendResponse(result)
      })
      return true

    case 'TEST_INSERT':
      // 测试插入功能
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'TEST_INSERT'
        }, (response) => {
          sendResponse(response || { success: false, error: 'No response' })
        })
      } else {
        sendResponse({ success: false, error: 'No active tab' })
      }
      return true

    default:
      sendResponse({ error: 'Unknown message type' })
  }
})

// 默认配置
function getDefaultConfig() {
  return {
    apiKey: 'sk-aaceedc5897743158c4b099dc08b24c5',
    baseUrl: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    taskType: 'text',
    reasoningMode: 'auto', // auto, intuition, cot, tot, meta
    language: 'zh',
    theme: 'light'
  }
}

// 术语数据（简化版，用于离线场景）
function getTerminologyData() {
  return {
    domains: [
      { id: 'tech', name: '技术', keywords: ['代码', '编程', 'API', '开发'] },
      { id: 'business', name: '商业', keywords: ['市场', '营销', '运营', '管理'] },
      { id: 'medical', name: '医学', keywords: ['症状', '诊断', '治疗', '药物'] },
      { id: 'legal', name: '法律', keywords: ['合同', '诉讼', '法规', '权利'] },
      { id: 'academic', name: '学术', keywords: ['论文', '研究', '文献', '分析'] },
      { id: 'creative', name: '创意', keywords: ['写作', '设计', '视频', '图片'] }
    ],
    commonTerminology: [
      { domain: 'tech', layman: '做一个网站', expert: '开发一个响应式 Web 应用' },
      { domain: 'tech', layman: '让app更快', expert: '优化性能，提升响应速度' },
      { domain: 'business', layman: '多卖点东西', expert: '提高转化率' },
      { domain: 'business', layman: '让人知道产品', expert: '品牌推广，市场营销策略' }
    ]
  }
}

// ==========================================
// 提示词库管理
// ==========================================

// 保存提示词
function savePrompt(promptData, callback) {
  console.log('[Gestalt Background] savePrompt 被调用:', promptData)

  chrome.storage.local.get(['gestaltPrompts'], (result) => {
    const prompts = result.gestaltPrompts || []
    console.log('[Gestalt Background] 当前提示词数量:', prompts.length)

    const newPrompt = {
      id: generateId(),
      content: promptData.content,
      title: promptData.title || generateTitle(promptData.content),
      description: promptData.description || '',
      tags: promptData.tags || [],
      taskType: promptData.taskType || 'text',
      reasoningMode: promptData.reasoningMode || 'auto',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0,
      isFavorite: false
    }

    prompts.push(newPrompt)
    console.log('[Gestalt Background] 准备保存, 新数量:', prompts.length)

    chrome.storage.local.set({ gestaltPrompts: prompts }, () => {
      console.log('[Gestalt Background] 保存成功')
      callback({ success: true, prompt: newPrompt })
    })
  })
}

// 获取所有提示词
function getPrompts(callback) {
  chrome.storage.local.get(['gestaltPrompts'], (result) => {
    const prompts = result.gestaltPrompts || []
    callback({ prompts: prompts.sort((a, b) => b.updatedAt - a.updatedAt) })
  })
}

// 删除提示词
function deletePrompt(promptId, callback) {
  chrome.storage.local.get(['gestaltPrompts'], (result) => {
    const prompts = result.gestaltPrompts || []
    const filtered = prompts.filter(p => p.id !== promptId)
    chrome.storage.local.set({ gestaltPrompts: filtered }, () => {
      callback({ success: true })
    })
  })
}

// 更新提示词
function updatePrompt(promptData, callback) {
  chrome.storage.local.get(['gestaltPrompts'], (result) => {
    const prompts = result.gestaltPrompts || []
    const index = prompts.findIndex(p => p.id === promptData.id)

    if (index >= 0) {
      prompts[index] = {
        ...prompts[index],
        ...promptData,
        updatedAt: Date.now()
      }
      chrome.storage.local.set({ gestaltPrompts: prompts }, () => {
        callback({ success: true, prompt: prompts[index] })
      })
    } else {
      callback({ success: false, error: 'Prompt not found' })
    }
  })
}

// 增加使用次数
function incrementUseCount(promptId, callback) {
  chrome.storage.local.get(['gestaltPrompts'], (result) => {
    const prompts = result.gestaltPrompts || []
    const index = prompts.findIndex(p => p.id === promptId)

    if (index >= 0) {
      prompts[index].useCount = (prompts[index].useCount || 0) + 1
      chrome.storage.local.set({ gestaltPrompts: prompts }, () => {
        if (callback) callback({ success: true })
      })
    }
  })
}

// 切换收藏状态
function toggleFavorite(promptId, callback) {
  chrome.storage.local.get(['gestaltPrompts'], (result) => {
    const prompts = result.gestaltPrompts || []
    const index = prompts.findIndex(p => p.id === promptId)

    if (index >= 0) {
      prompts[index].isFavorite = !prompts[index].isFavorite
      chrome.storage.local.set({ gestaltPrompts: prompts }, () => {
        callback({ success: true, isFavorite: prompts[index].isFavorite })
      })
    }
  })
}

// AI 生成标签
async function generateTagsForPrompt(promptData, config, callback) {
  try {
    const systemPrompt = `你是一个智能标签生成助手。分析给定的提示词，生成3-5个最相关的标签。

标签应该：
- 反映提示词的应用领域（如：产品、代码、写作、设计等）
- 反映提示词的功能类型（如：分析、生成、优化、审查等）
- 简洁明了，每个标签2-4个字
- 用中文表达

只返回标签列表，每行一个标签，不要其他内容。`

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `提示词标题：${promptData.title}\n\n提示词内容：\n${promptData.content}` }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 解析标签
    const tags = content
      .split('\n')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 10)
      .slice(0, 5)

    callback({ success: true, tags: tags.length > 0 ? tags : ['通用'] })
  } catch (error) {
    console.error('[Gestalt] Tag generation error:', error)
    // 失败时返回默认标签
    callback({ success: true, tags: ['通用'] })
  }
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 从内容生成标题
function generateTitle(content) {
  const firstLine = content.split('\n')[0].trim()
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine
}

// 快速保存提示词（用于浮动按钮）
function quickSavePrompt(content, platform, callback) {
  chrome.storage.local.get(['gestaltPrompts', 'gestaltConfig'], (result) => {
    const prompts = result.gestaltPrompts || []
    const config = result.gestaltConfig || getDefaultConfig()

    const newPrompt = {
      id: generateId(),
      content: content,
      title: generateTitle(content),
      description: `从 ${platform} 快速保存`,
      tags: [platform],
      taskType: config.taskType || 'text',
      reasoningMode: config.reasoningMode || 'auto',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0,
      isFavorite: false
    }

    prompts.push(newPrompt)
    chrome.storage.local.set({ gestaltPrompts: prompts }, () => {
      callback({ success: true, prompt: newPrompt })
    })
  })
}

// 智能识别任务类型
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

// 获取优化系统提示词
function getOptimizeSystemPrompt(mode) {
  const prompts = {
    text: `你是一个专业的AI提示词优化助手。用户会给你一段原始文本，你需要将其优化成一个更专业、更清晰、更有效的AI提示词。

优化原则：
1. 明确任务目标 - 清晰说明需要AI完成什么
2. 添加上下文 - 提供必要的背景信息
3. 指定格式 - 说明期望的输出格式
4. 添加约束条件 - 如字数、风格、角度等
5. 保持简洁 - 去除冗余信息

请直接返回优化后的提示词，不要添加解释、markdown格式或任何前缀。`,

    image: `你是一个专业的AI绘画提示词优化助手，擅长 Midjourney、Stable Diffusion、DALL-E 等平台。

优化原则：
1. 主体描述 - 清晰描述画面主体
2. 艺术风格 - 明确风格（写实/插画/油画等）
3. 光照氛围 - 描述光线和整体氛围
4. 构图视角 - 指定构图方式和镜头角度
5. 细节补充 - 添加关键细节和质感

请直接返回优化后的英文提示词，不要添加解释。`,

    video: `你是一个专业的AI视频生成提示词优化助手，擅长 Sora、Runway、Pika 等平台。

优化原则：
1. 场景描述 - 详细描述视频场景
2. 运镜方式 - 指定镜头运动（推拉摇移跟等）
3. 时间节奏 - 说明时长和节奏变化
4. 视觉风格 - 明确画面风格和色调
5. 关键元素 - 补充重要的视觉元素

请直接返回优化后的视频提示词，不要添加解释。`,

    audio: `你是一个专业的AI音频生成提示词优化助手，擅长 Suno、Udio 等音乐平台，以及播客和有声书创作。

请先分析用户输入，判断是：
1. 音乐风格描述 - 生成英文提示词，包含流派、情绪、乐器、节奏等
2. 歌词创作 - 优化为完整的歌曲结构（主歌/副歌/桥段）
3. 播客脚本 - 创建对话式节目脚本，包含开场、主体、结尾
4. 有声书演播 - 编写故事演播脚本，包含旁白、角色对话

请直接返回优化后的内容，格式清晰明确。`
  }

  return prompts[mode] || prompts.text
}

// 快速优化文本（用于浮动按钮一键优化，支持智能识别）
async function quickOptimizeText(originalText, platform, callback) {
  if (!originalText || originalText.trim().length === 0) {
    callback({ success: false, error: '输入为空' })
    return
  }

  try {
    // 获取配置
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['gestaltConfig'], resolve)
    })
    const config = result.gestaltConfig || getDefaultConfig()

    // 智能识别任务类型
    const detectedMode = detectTaskType(originalText)
    console.log('[Gestalt] 智能识别任务类型:', detectedMode)

    // 获取对应的系统提示词
    const systemPrompt = getOptimizeSystemPrompt(detectedMode)

    // 调用AI API
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `原始内容：\n${originalText}` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const optimizedText = data.choices?.[0]?.message?.content?.trim()

    if (optimizedText) {
      // 返回优化结果，包含识别到的类型
      callback({
        success: true,
        optimizedText: optimizedText,
        detectedMode: detectedMode,
        modeName: getModeName(detectedMode)
      })
    } else {
      callback({ success: false, error: '优化失败，未返回有效内容' })
    }
  } catch (error) {
    console.error('[Gestalt] 快速优化失败:', error)
    callback({ success: false, error: error.message || '优化失败' })
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

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Gestalt] 插件已安装/更新:', details.reason)

  if (details.reason === 'install') {
    // 首次安装时打开欢迎页面
    chrome.tabs.create({
      url: 'welcome.html'
    })

    // 创建右键菜单
    createContextMenus()
  } else if (details.reason === 'update') {
    // 更新时重新创建菜单
    createContextMenus()
  }
})

// 创建右键菜单
function createContextMenus() {
  // 移除旧菜单
  chrome.contextMenus.removeAll(() => {
    // 保存选中文本为提示词
    chrome.contextMenus.create({
      id: 'saveSelectionAsPrompt',
      title: '保存为提示词',
      contexts: ['selection']
    })

    // 用 Gestalt 优化选中文本
    chrome.contextMenus.create({
      id: 'optimizeWithGestalt',
      title: '用 Gestalt 优化',
      contexts: ['selection']
    })

    // 打开 Gestalt
    chrome.contextMenus.create({
      id: 'openGestalt',
      title: '打开 Gestalt',
      contexts: ['all']
    })
  })
}

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('[Gestalt] 右键菜单点击:', info.menuItemId)

  switch (info.menuItemId) {
    case 'saveSelectionAsPrompt':
      if (info.selectionText && tab?.id) {
        chrome.storage.local.get(['gestaltConfig'], (result) => {
          const config = result.gestaltConfig || getDefaultConfig()

          chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_SAVE_PROMPT_DIALOG',
            content: info.selectionText
          })
        })
      }
      break

    case 'optimizeWithGestalt':
      if (info.selectionText && tab?.id) {
        // 打开侧边栏并自动填入选中的文本
        chrome.sidePanel.open({ tabId: tab.id }).then(() => {
          // 延迟发送消息，确保侧边栏已打开
          setTimeout(() => {
            chrome.runtime.sendMessage({
              type: 'SET_USER_INPUT',
              content: info.selectionText
            })
          }, 500)
        })
      }
      break

    case 'openGestalt':
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id })
      }
      break
  }
})

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  console.log('[Gestalt] 快捷键命令:', command)

  switch (command) {
    case 'open-gestalt':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id })
        }
      })
      break

    case 'save-prompt':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'QUICK_SAVE_PROMPT'
          })
        }
      })
      break
  }
})

// 点击扩展程序图标时打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id })
  }
})
