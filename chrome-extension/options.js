// ==========================================
// Gestalt Chrome Extension - Options Page
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // 加载配置
  chrome.storage.local.get(['gestaltConfig'], (result) => {
    if (result.gestaltConfig) {
      document.getElementById('apiKey').value = result.gestaltConfig.apiKey || ''
      document.getElementById('baseUrl').value = result.gestaltConfig.baseUrl || 'https://api.deepseek.com/v1'
      document.getElementById('modelName').value = result.gestaltConfig.modelName || ''
      document.getElementById('language').value = result.gestaltConfig.language || 'zh'
      document.getElementById('reasoningMode').value = result.gestaltConfig.reasoningMode || 'auto'
    }
  })

  // 保存配置
  document.getElementById('saveBtn').addEventListener('click', () => {
    const config = {
      apiKey: document.getElementById('apiKey').value,
      baseUrl: document.getElementById('baseUrl').value,
      modelName: document.getElementById('modelName').value,
      language: document.getElementById('language').value,
      reasoningMode: document.getElementById('reasoningMode').value,
      taskType: 'text'
    }

    chrome.storage.local.set({ gestaltConfig: config }, () => {
      alert('设置已保存！')
      window.close()
    })
  })

  // 重置配置
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('apiKey').value = 'sk-aaceedc5897743158c4b099dc08b24c5'
    document.getElementById('baseUrl').value = 'https://api.deepseek.com/v1'
    document.getElementById('modelName').value = 'deepseek-chat'
    document.getElementById('language').value = 'zh'
    document.getElementById('reasoningMode').value = 'auto'
  })
})
