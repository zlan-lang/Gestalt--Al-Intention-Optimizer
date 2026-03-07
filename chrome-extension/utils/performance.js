// ==========================================
// Gestalt Chrome Extension - Performance Utilities
// 性能优化工具函数
// ==========================================

/**
 * 防抖函数 - 延迟执行，直到停止触发指定时间后才执行
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} - 防抖后的函数
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout

  return function executedFunction(...args) {
    const context = this

    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }
}

/**
 * 节流函数 - 限制执行频率，指定时间内最多执行一次
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} - 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle

  return function(...args) {
    const context = this

    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 请求动画帧节流 - 用于视觉更新
 * @param {Function} func - 要执行的函数
 * @returns {Function} - 节流后的函数
 */
export function rafThrottle(func) {
  let rafId = null

  return function(...args) {
    if (rafId) return

    rafId = requestAnimationFrame(() => {
      func.apply(this, args)
      rafId = null
    })
  }
}

/**
 * 延迟执行
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} - Promise 对象
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 批处理函数 - 收集多个调用后批量执行
 * @param {Function} func - 要执行的函数（接收数组参数）
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 批处理后的函数
 */
export function batch(func, wait = 100) {
  let items = []
  let timeout = null

  return function(item) {
    items.push(item)

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(items)
      items = []
      timeout = null
    }, wait)
  }
}

/**
 * 记忆化函数 - 缓存函数结果
 * @param {Function} func - 要记忆化的函数
 * @param {Function} keyGenerator - 生成缓存键的函数
 * @returns {Function} - 记忆化后的函数
 */
export function memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  return function(...args) {
    const key = keyGenerator(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func.apply(this, args)
    cache.set(key, result)
    return result
  }
}

/**
 * 检测空闲时间并执行任务
 * @param {Function} func - 要执行的函数
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {void}
 */
export function runWhenIdle(func, timeout = 2000) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => func(), { timeout })
  } else {
    // 降级方案
    setTimeout(func, 0)
  }
}

/**
 * 创建可取消的 Promise
 * @param {Function} executor - Promise 执行器
 * @returns {Object} - 包含 promise 和 cancel 方法的对象
 */
export function cancellablePromise(executor) {
  let cancelled = false

  const promise = new Promise((resolve, reject) => {
    executor(
      value => {
        if (!cancelled) resolve(value)
      },
      error => {
        if (!cancelled) reject(error)
      }
    )
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
    }
  }
}

// 如果在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debounce,
    throttle,
    rafThrottle,
    delay,
    batch,
    memoize,
    runWhenIdle,
    cancellablePromise
  }
}
