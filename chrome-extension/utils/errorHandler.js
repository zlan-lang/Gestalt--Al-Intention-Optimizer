// ==========================================
// Gestalt Chrome Extension - Unified Error Handler
// 统一错误处理和用户反馈系统
// ==========================================

class ErrorHandler {
  /**
   * 显示 Toast 通知
   * @param {string} message - 显示的消息
   * @param {string} type - 消息类型: 'success', 'error', 'warning', 'info'
   * @param {number} duration - 显示时长（毫秒）
   */
  static showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message

    document.body.appendChild(toast)

    // 触发重排以启动动画
    requestAnimationFrame(() => {
      toast.classList.add('show')
    })

    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, duration)
  }

  /**
   * 处理异步操作并捕获错误
   * @param {Function} asyncFn - 异步函数
   * @param {string} errorMsg - 错误消息前缀
   * @returns {Promise<any>} - 操作结果或 null
   */
  static async handleAsync(asyncFn, errorMsg = '操作失败') {
    try {
      return await asyncFn()
    } catch (error) {
      console.error('[Gestalt Error]', error)
      this.showToast(`${errorMsg}: ${error.message}`, 'error')
      return null
    }
  }

  /**
   * 验证配置对象
   * @param {Object} config - 配置对象
   * @returns {boolean} - 配置是否有效
   */
  static validateConfig(config) {
    if (!config) {
      this.showToast('配置未找到，请重新设置', 'error')
      return false
    }
    if (!config.apiKey) {
      this.showToast('API Key 未配置，请先在设置中配置', 'warning')
      return false
    }
    if (!config.baseUrl) {
      this.showToast('Base URL 未配置', 'warning')
      return false
    }
    return true
  }

  /**
   * 处理 API 响应错误
   * @param {Response} response - fetch 响应对象
   * @param {string} action - 操作描述
   */
  static async handleApiError(response, action = 'API 请求') {
    let errorMsg = `${action}失败`

    try {
      const data = await response.json()
      errorMsg = data.error?.message || data.message || errorMsg
    } catch (e) {
      errorMsg = `${errorMsg} (${response.status})`
    }

    console.error('[Gestalt API Error]', errorMsg)
    this.showToast(errorMsg, 'error')
  }

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {string} title - 对话框标题
   * @returns {boolean} - 用户是否确认
   */
  static confirm(message, title = '确认') {
    // 如果需要自定义对话框，可以在这里实现
    return window.confirm(`${title}\n\n${message}`)
  }

  /**
   * 记录错误到控制台（带上下文）
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @param {Object} data - 相关数据
   */
  static logError(error, context = '', data = {}) {
    console.error(`[Gestalt Error${context ? ` - ${context}` : ''}]`, {
      message: error.message,
      stack: error.stack,
      data
    })
  }

  /**
   * 创建带错误处理的包装函数
   * @param {Function} fn - 原始函数
   * @param {string} errorMsg - 错误消息
   * @returns {Function} - 包装后的函数
   */
  static wrapAsync(fn, errorMsg = '操作失败') {
    return async (...args) => {
      return this.handleAsync(() => fn(...args), errorMsg)
    }
  }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler
}
