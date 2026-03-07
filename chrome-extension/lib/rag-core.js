// ==========================================
// Gestalt RAG 核心系统 (简化版 - 适配 Chrome 扩展)
// 包含：术语翻译、复杂度检测、智能推理模式切换
// ==========================================

// ==========================================
// 1. 复杂度检测与推理模式选择
// ==========================================

/**
 * 检测文本任务的复杂度，返回对应的推理模式
 */
export function detectTextComplexity(userInput) {
  const input = userInput.toLowerCase()

  // 复杂决策任务 → 思维树
  const totKeywords = ['决策', '方案', '选择', '权衡', '战略', '规划', '架构设计', '比较分析', '博弈']
  if (totKeywords.some(kw => input.includes(kw))) {
    return 'tot'  // TREE_OF_THOUGHTS
  }

  // 逻辑推理任务 → 思维链
  const cotKeywords = ['计算', '逻辑', '代码', '编程', '调试', '推理', '分析', '诊断', '估算', '费米', '算法']
  if (cotKeywords.some(kw => input.includes(kw))) {
    return 'cot'  // CHAIN_OF_THOUGHT
  }

  // 简单查询 → 直觉式
  const simpleKeywords = ['翻译', '总结', '解释', '是什么', '怎么样', '介绍']
  if (simpleKeywords.some(kw => input.includes(kw))) {
    return 'intuition'  // ZERO_SHOT
  }

  // 默认使用 Meta-Prompting
  return 'meta'
}

/**
 * 获取推理模式的显示名称
 */
export function getReasoningModeDisplayName(mode) {
  const modeMap = {
    'intuition': { name: '直觉式', complexity: '简单', icon: '⚡' },
    'cot': { name: '思维链', complexity: '中等', icon: '🧠' },
    'tot': { name: '思维树', complexity: '复杂', icon: '🌳' },
    'meta': { name: '元提示', complexity: '智能', icon: '✨' }
  }
  return modeMap[mode] || modeMap['meta']
}

// ==========================================
// 2. 术语翻译系统 (简化版 - 基于关键词匹配)
// ==========================================

/**
 * 简化的术语数据库
 * 真正的 RAG 系统使用向量检索，这里用关键词匹配作为轻量级替代
 */
const TERMINOLOGY_DATABASE = {
  '技术': {
    '网站': { expert: 'Web应用', example: '���栈Web应用开发' },
    '做': { expert: '开发/构建', example: '构建可扩展的应用架构' },
    '快': { expert: '高性能', example: '优化响应时间和并发处理' },
    '好看': { expert: '优秀的UI/UX设计', example: '符合现代设计规范的用户界面' },
    '好用': { expert: '易用性', example: '直观的用户体验和流畅的交互流程' },
    '代码': { expert: '源代码', example: '高质量、可维护的代码实现' },
    '程序': { expert: '软件系统', example: '模块化的软件架构' },
    'bug': { expert: '软件缺陷', example: '需要修复的技术问题' }
  },
  '商业': {
    '卖东西': { expert: '提升转化率', example: '优化销售漏斗，提高转化率' },
    '让人知道': { expert: '品牌推广', example: '多渠道品牌营销策略' },
    '赚钱': { expert: '实现盈利', example: '可持续的商业模式和收入增长' },
    '客户': { expert: '目标用户群体', example: '精准的用户画像和需求分析' }
  },
  '医学': {
    '疼': { expert: '疼痛症状', example: '患者主诉的疼痛部位和程度' },
    '病': { expert: '疾病', example: '具体的临床诊断结果' },
    '检查': { expert: '诊断检查', example: '必要的医学检查和检验项目' }
  },
  '法律': {
    '告': { expert: '提起诉讼', example: '通过法律途径维护权益' },
    '合同': { expert: '法律协议', example: '具有法律效力的合同条款' },
    '赔': { expert: '损害赔偿', example: '依法要求的经济赔偿' }
  },
  '金融': {
    '投资': { expert: '资产配置', example: '多元化投资组合管理' },
    '赚钱': { expert: '投资回报', example: '可持续的投资收益增长' },
    '亏': { expert: '投资损失', example: '风险评估和止损策略' }
  }
}

/**
 * 检测用户输入涉及的领域
 */
export function detectDomain(userInput) {
  const input = userInput.toLowerCase()

  const domainKeywords = {
    '技术': ['代码', '编程', '网站', '系统', '算法', '数据库', 'API', '开发', '部署', '性能', '优化', '应用', '软件'],
    '商业': ['市场', '营销', '销售', '客户', '产品', '运营', '管理', '战略', '增长', '转化', '品牌', '赚钱', '卖'],
    '医学': ['疼', '痛', '症状', '诊断', '治疗', '病', '医', '药', '检查', '手术', '发烧', '头晕', '不舒服'],
    '法律': ['合同', '诉讼', '法律', '法规', '权利', '义务', '违约', '赔偿', '起诉', '仲裁', '告'],
    '金融': ['投资', '理财', '股票', '基金', '贷款', '利率', '收益', '风险', '亏损', '资产', '赚钱']
  }

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => input.includes(kw))) {
      return domain
    }
  }

  return null
}

/**
 * 翻译用户输入中的术语
 * 将小白术语转换为专家术语
 */
export function translateTerminology(userInput, domain = null) {
  const detectedDomain = domain || detectDomain(userInput)

  if (!detectedDomain) {
    return {
      original: userInput,
      translated: userInput,
      domain: null,
      translations: []
    }
  }

  const terminology = TERMINOLOGY_DATABASE[detectedDomain]
  if (!terminology) {
    return {
      original: userInput,
      translated: userInput,
      domain: detectedDomain,
      translations: []
    }
  }

  let translated = userInput
  const translations = []

  for (const [layman, expert] of Object.entries(terminology)) {
    if (translated.includes(layman)) {
      translated = translated.replace(new RegExp(layman, 'g'), expert.expert)
      translations.push({
        layman,
        expert: expert.expert,
        example: expert.example
      })
    }
  }

  return {
    original: userInput,
    translated,
    domain: detectedDomain,
    translations
  }
}

// ==========================================
// 3. 音频知识库
// ==========================================

export const AUDIO_KNOWLEDGE = {
  genres: {
    '电子音乐': {
      description: '使用电子乐器和数字技术制作的音乐',
      keywords: ['电音', 'EDM', '电子', 'DJ', '舞曲'],
      subgenres: ['House', 'Techno', 'Dubstep', 'Trance', 'Drum and Bass']
    },
    '古典音乐': {
      description: '传统管弦乐和室内乐',
      keywords: ['古典', '交响', '管弦', '小提琴', '钢琴'],
      subgenres: ['巴洛克', '古典主义', '浪漫主义', '现代派']
    },
    '爵士乐': {
      description: '起源于美国黑人社区的音乐风格',
      keywords: ['爵士', 'Jazz', '摇摆', '即兴'],
      subgenres: ['摇摆乐', '比波普', '酷爵士', '融合爵士']
    },
    '摇滚乐': {
      description: '以强劲节奏和电吉他为特色',
      keywords: ['摇滚', 'Rock', '吉他', '鼓'],
      subgenres: ['经典摇滚', '朋克', '金属', '另类摇滚']
    },
    '流行音乐': {
      description: '大众喜闻乐见的商业音乐',
      keywords: ['流行', 'Pop', '大众', '商业'],
      subgenres: ['舞曲流行', '抒情歌', 'R&B', '说唱流行']
    },
    '环境音乐': {
      description: '营造氛围的背景音乐',
      keywords: ['环境', '氛围', '背景', 'Ambient'],
      subgenres: ['轻音乐', '新世纪', '冥想音乐', '咖啡厅音乐']
    }
  },
  instruments: {
    '钢琴': 'keyboard, 88 keys, versatile',
    '吉他': 'string instrument, acoustic or electric',
    '小提琴': 'string instrument, bowed, expressive',
    '大提琴': 'string instrument, bowed, deep tone',
    '长笛': 'woodwind, bright and clear',
    '萨克斯': 'woodwind, jazz and classical',
    '鼓': 'percussion, rhythm foundation',
    '贝斯': 'string instrument, low frequency',
    '合成器': 'electronic, versatile sounds',
    '管弦乐': 'full orchestral ensemble'
  },
  moods: {
    '欢快': 'upbeat, energetic, major key',
    '悲伤': 'melancholic, slow tempo, minor key',
    '紧张': 'dissonant, fast tempo, dramatic',
    '放松': 'calm, slow tempo, consonant',
    '史诗': 'grand, orchestral, powerful',
    '神秘': 'ambient, ethereal, sparse',
    '浪漫': 'emotional, warm, expressive',
    '恐怖': 'dissonant, dark, suspenseful'
  },
  tempos: {
    '慢板': '60-80 BPM',
    '行板': '80-100 BPM',
    '中板': '100-120 BPM',
    '快板': '120-160 BPM',
    '急板': '160-200 BPM'
  }
}

/**
 * 增强音频生成提示词
 */
export function enhanceAudioPrompt(userInput) {
  const input = userInput.toLowerCase()
  let enhancement = {
    genre: null,
    mood: null,
    tempo: null,
    instruments: [],
    additionalContext: []
  }

  // 检测流派
  for (const [genre, info] of Object.entries(AUDIO_KNOWLEDGE.genres)) {
    if (info.keywords.some(kw => input.includes(kw))) {
      enhancement.genre = genre
      enhancement.additionalContext.push(`风格：${info.description}，子类型包括：${info.subgenres.join('、')}`)
      break
    }
  }

  // 检测情绪
  for (const [mood, description] of Object.entries(AUDIO_KNOWLEDGE.moods)) {
    if (input.includes(mood)) {
      enhancement.mood = mood
      enhancement.additionalContext.push(`情绪：${description}`)
      break
    }
  }

  // 检测乐器（简单匹配）
  for (const [instrument, desc] of Object.entries(AUDIO_KNOWLEDGE.instruments)) {
    if (input.includes(instrument)) {
      enhancement.instruments.push(instrument)
    }
  }

  // 检测速度描述
  if (input.includes('快') || input.includes('激烈') || input.includes('急')) {
    enhancement.tempo = '快板 (120-160 BPM)'
  } else if (input.includes('慢') || input.includes('舒缓') || input.includes('柔和')) {
    enhancement.tempo = '慢板 (60-80 BPM)'
  } else if (input.includes('中等') || input.includes('适中')) {
    enhancement.tempo = '中板 (100-120 BPM)'
  }

  return enhancement
}
