// ==========================================
// Gestalt 提示词优化策略系统 (升级版)
// 集成 RAG 增强和智能推理模式切换
// ==========================================

import { PromptType } from './types.js'
import { detectTextComplexity, getReasoningModeDisplayName, translateTerminology, detectDomain, enhanceAudioPrompt } from './rag-core.js'

// ==========================================
// 主系统提示词 (根据任务类型动态生成)
// ==========================================

/**
 * 获取编译器系统提示词
 * @param {string} taskType - 任务类型 (text/image/video/audio)
 * @param {string} userInput - 用户输入
 * @param {boolean} useMemory - 是否使用记忆（对话历史）
 */
export function getCompilerSystemPrompt(taskType = 'text', userInput = '', useMemory = true) {
  // 1. 检测复杂度和推理模式
  const reasoningMode = detectTextComplexity(userInput)
  const modeInfo = getReasoningModeDisplayName(reasoningMode)

  // 2. RAG 增强：术语翻译
  const translation = translateTerminology(userInput)
  const domain = translation.domain || '通用'

  // 3. 构建基础提示词
  let basePrompt = `你是 Gestalt 2.0 - AI 提示词优化专家。

你的任务是将用户的模糊需求转化为专业、结构化、高质量的提示词。

**当前配置：**
- 任务类型：${getTaskTypeName(taskType)}
- 推理模式：${modeInfo.icon} ${modeInfo.name} (${modeInfo.complexity}复杂度)
- 专业领域：${domain}
${useMemory ? '- 记忆功能：✅ 已开启 (自动使用对话历史增强上下文)' : '- 记忆功能：❌ 已关闭'}
`

  // 4. 添加任务特定的优化策略
  basePrompt += `\n\n${getTaskSpecificStrategy(taskType, reasoningMode, translation)}`

  // 5. 添加推理模式指导
  basePrompt += `\n\n${getReasoningModeGuidance(reasoningMode)}`

  return basePrompt
}

/**
 * 获取任务类型的名称
 */
function getTaskTypeName(type) {
  const names = {
    'text': '文本生成',
    'image': '图片生成',
    'video': '视频生成',
    'audio': '音频生成'
  }
  return names[type] || '文本生成'
}

/**
 * 获取任务特定的优化策略
 */
function getTaskSpecificStrategy(taskType, reasoningMode, translation) {
  const strategies = {
    text: getTextStrategy(reasoningMode, translation),
    image: getImageStrategy(),
    video: getVideoStrategy(),
    audio: getAudioStrategy()
  }
  return strategies[taskType] || strategies.text
}

// ==========================================
// 文本任务策略
// ==========================================

function getTextStrategy(reasoningMode, translation) {
  let strategy = `**文本生成优化策略：**

1. **明确性原则**
   - 清晰定义任务目标
   - 指定期望的输出格式
   - 设置边界条件和约束

2. **专业性增强**
   - 使用精确的技术术语
   - 提供必要的背景信息
   - 包含最佳实践建议

3. **可执行性**
   - 提供具体的步骤或框架
   - 给出评估标准
   - 包含示例或模板`

  // 如果检测到专业领域，添加术语翻译提示
  if (translation.domain && translation.translations.length > 0) {
    strategy += `\n\n4. **术语优化** (检测到${translation.domain}领域)
   - 将用户的小白术语转换为专业术语
   - 提供专家级的表达方式
   - 使用行业标准表述`

    strategy += `\n\n**检测到的术语翻译：**
${translation.translations.map(t => `- "${t.layman}" → "${t.expert}"`).join('\n')}`
  }

  // 根据推理模式添加特定指导
  strategy += `\n\n5. **推理模式应用** (${getReasoningModeDisplayName(reasoningMode).name})`
  switch (reasoningMode) {
    case 'tot':
      strategy += `
   - 鼓励AI探索多种可能的解决方案
   - 比较不同方案的优劣
   - 采用决策树或博弈论方法
   - 提供权衡建议`
      break
    case 'cot':
      strategy += `
   - 要求AI展示推理步骤
   - 采用分步分析方法
   - 明确中间推理过程
   - 验证每个步骤的正确性`
      break
    case 'intuition':
      strategy += `
   - 直接给出答案，无需过度解释
   - 保持简洁明了
   - 适合快速查询和简单任务`
      break
    default: // meta
      strategy += `
   - 使用结构化的指令框架
   - 明确角色和任务
   - 设置输出规范
   - 提供质量标准`
  }

  return strategy
}

// ==========================================
// 图片生成策略
// ==========================================

function getImageStrategy() {
  return `**图片生成优化策略：**

1. **主体描述**
   - 清晰描述主要对象
   - 包含外观、姿态、表情细节
   - 明确数量和位置关系

2. **风格定义**
   - 指定艺术风格 (写实/插画/动漫/水彩等)
   - 参考艺术家或作品风格
   - 设定视觉语言和色调

3. **环境与氛围**
   - 背景场景描述
   - 光照条件 (自然光/影棚光/戏剧光)
   - 天气和时间

4. **构图与视角**
   - 角度 (俯视/仰视/平视)
   - 景深 (前景/中景/背景)
   - 构图法则 (三分法/黄金分割/对称)

5. **质量修饰词**
   - 分辨率要求
   - 风格强度 (强烈/温和/细腻)
   - 特殊效果 (景深/动态模糊/光晕)`
}

// ==========================================
// 视频生成策略
// ==========================================

function getVideoStrategy() {
  return `**视频生成优化策略：**

1. **场景设定**
   - 时间和地点
   - 环境氛围
   - 季节和天气

2. **镜头语言**
   - 起幅 (远景/全景/中景/近景/特写)
   - 镜头运动 (推/拉/摇/移/跟/升/降)
   - 镜头角度 (俯视/仰视/平视/荷兰角)

3. **动作与节奏**
   - 主体动作描述
   - 运动轨迹
   - 节奏和速度变化
   - 转场方式

4. **视觉风格**
   - 色彩基调
   - 美术风格
   - 灯光设计
   - 时代背景

5. **时间结构**
   - 总时长
   - 开头-发展-高潮-结尾
   - 关键时间节点
   - 节奏变化点`
}

// ==========================================
// 音频生成策略
// ==========================================

function getAudioStrategy() {
  return `**音频生成优化策略：**

1. **音乐类型**
   - 指定流派 (电子/古典/爵士/摇滚/流行/环境音乐等)
   - 子类型或风格细分
   - 参考艺术家或作品

2. **情绪氛围**
   - 主要情绪 (欢快/悲伤/紧张/放松/史诗/神秘/浪漫/恐怖)
   - 情感曲线和变化
   - 目标场景和用途

3. **音乐要素**
   - 速度/节奏 (BPM)
   - 调式 (大调/小调)
   - 和声进行
   - 乐器配置
   - 主奏乐器

4. **结构安排**
   - 曲式结构 (前奏-主歌-副歌-间奏-结尾)
   - 重复和变奏
   - 高潮位置
   - 转换点

5. **技术规格**
   - 时长
   - 音质要求
   - 特殊效果 (混响/延迟/失真等)
   - 动态范围`
}

// ==========================================
// 推理模式指导
// ==========================================

function getReasoningModeGuidance(mode) {
  const guidance = {
    tot: `**思维树 (Tree of Thoughts) 模式：**
当用户提出复杂决策、方案比较或战略规划问题时：
1. 识别问题中的关键决策点
2. 为每个决策点生成多个可能的选项
3. 评估每个选项的利弊
4. 推荐最优方案并说明理由
5. 提供备选方案作为fallback`,
    cot: `**思维链 (Chain of Thought) 模式：**
当用户提出逻辑推理、分析或技术问题时：
1. 分解问题为多个步骤
2. 逐步推理，展示中间过程
3. 验证每个步骤的正确性
4. 得出最终结论
5. 必要时提供检查方法`,
    intuition: `**直觉式 (Zero-Shot) 模式：**
当用户提出简单查询、翻译或总结问题时：
1. 直接给出准确答案
2. 保持简洁明了
3. 避免过度解释
4. 专注于用户的核心需求`,
    meta: `**元提示 (Meta-Prompting) 模式：**
对于一般性任务：
1. 使用结构化的提示词框架
2. 明确AI的角色定位
3. 清晰定义任务目标和约束
4. 设置输出格式和质量标准
5. 提供必要的上下文信息`
  }

  return guidance[mode] || guidance.meta
}

// ==========================================
// 快速提示词示例
// ==========================================

export const QUICK_PROMPTS = {
  text: [
    { label: '产品经理', prompt: '帮我设计一个产品经理角色的提示词，包括需求分析、竞品研究和用户调研能力' },
    { label: '代码审查', prompt: '帮我优化代码审查的提示词，包括安全性、性能和可维护性检查' },
    { label: '数据分析', prompt: '帮我创建一个数据分析专家的提示词，擅长Python、SQL和数据可视化' }
  ],
  image: [
    { label: '猫咪', prompt: '一只可爱的猫咪在花园里，阳光明媚，专业摄影，高细节' },
    { label: '赛博朋克', prompt: '未来赛博朋克城市夜景，霓虹灯，雨夜，电影级质感' },
    { label: '山水画', prompt: '中国传统山水画风格，山水意境，水墨画，留白艺术' }
  ],
  video: [
    { label: '咖啡教程', prompt: '制作一个咖啡冲泡过程的教程视频，特写镜头，温暖色调' },
    { label: '产品展示', prompt: '产品展示视频，科技感风格，360度旋转展示，动态光线' },
    { label: '延时摄影', prompt: '城市延时摄影，从白天到夜晚，车流人流，4K高画质' }
  ],
  audio: [
    { label: '咖啡厅音乐', prompt: '制作一首轻松的咖啡厅背景音乐，环境音乐，放松，慢节奏' },
    { label: '游戏音乐', prompt: '赛博朋克风格的电子音乐，适合游戏场景，快节奏，激烈' },
    { label: '电影配乐', prompt: '电影预告片风格的史诗级管弦乐，宏大，戏剧性，紧张感' }
  ]
}

/**
 * 获取快速提示词
 */
export function getQuickPrompts(taskType) {
  return QUICK_PROMPTS[taskType] || QUICK_PROMPTS.text
}

// ==========================================
// 提取优化后的提示词
// ==========================================

/**
 * 从 AI 回复中提取最终的提示词
 * 支持多种格式
 */
export function extractPromptFromResponse(response) {
  if (!response) return ''

  // 移除可能的代码块标记
  let cleaned = response
    .replace(/```[\w]*\n?/g, '')
    .replace(/```/g, '')
    .trim()

  // 尝试提取引号内的内容
  const quoteMatch = cleaned.match(/"([^"]+)"/)
  if (quoteMatch) {
    return quoteMatch[1]
  }

  // 尝试提取【优化后的提示词】之后的内容
  const markerMatch = cleaned.match(/(?:优化后的提示词|提示词)[:：]\s*\n([\s\S]+)/i)
  if (markerMatch) {
    return markerMatch[1].trim()
  }

  // 如果都没有，返回整个回复
  return cleaned
}

/**
 * 提取推理模式信息
 */
export function extractReasoningMode(response) {
  const modePatterns = {
    tot: /思维树|Tree of Thoughts|ToT/i,
    cot: /思维链|Chain of Thought|CoT/i,
    intuition: /直觉式|Zero-Shot|直接响应/i,
    meta: /元提示|Meta-Prompting|结构化/i
  }

  for (const [mode, pattern] of Object.entries(modePatterns)) {
    if (pattern.test(response)) {
      return getReasoningModeDisplayName(mode)
    }
  }

  return getReasoningModeDisplayName('meta')
}
