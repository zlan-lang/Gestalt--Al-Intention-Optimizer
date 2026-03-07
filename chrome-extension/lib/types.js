// ==========================================
// Gestalt Chrome Extension - 类型定义
// ==========================================

// 任务类型枚举
export const PromptType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio'
}

// 推理模式枚举
export const LogicMode = {
  ZERO_SHOT: 'intuition',      // 直觉式：闲聊、简单查询
  CHAIN_OF_THOUGHT: 'cot',     // 思维链：逻辑推理、数学、代码
  TREE_OF_THOUGHTS: 'tot',     // 思维树：复杂决策、多视角博弈
  META_PROMPTING: 'meta'       // 元提示：结构化指令构建
}

// 任务类型选项
export const TASK_TYPE_OPTIONS = [
  {
    type: PromptType.TEXT,
    name: '文本生成',
    description: '对话、写作、代码、分析等文本任务',
    icon: '📝'
  },
  {
    type: PromptType.IMAGE,
    name: '图片生成',
    description: 'Midjourney、Flux、DALL-E 等图像模型',
    icon: '🎨'
  },
  {
    type: PromptType.VIDEO,
    name: '视频生成',
    description: 'Sora、Runway、Veo 等视频模型',
    icon: '🎬'
  },
  {
    type: PromptType.AUDIO,
    name: '音频生成',
    description: 'Suno、Udio、AudioCraft 等音频模型',
    icon: '🎵'
  }
]

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
