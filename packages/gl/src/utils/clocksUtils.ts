// clock.ts

// 检测是否在浏览器环境
const isBrowser =
  typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'

// 为 Node 环境提供 requestAnimationFrame 和 cancelAnimationFrame 的 polyfill
const requestAnimationFrame: (callback: FrameRequestCallback) => number = isBrowser
  ? window.requestAnimationFrame.bind(window)
  : (callback: FrameRequestCallback) => setTimeout(callback, 16) as unknown as number

const cancelAnimationFrame: (handle: number) => void = isBrowser
  ? window.cancelAnimationFrame.bind(window)
  : (handle: number) => clearTimeout(handle)

type Subscriber = (elapsed: number) => void

class ShaderClock {
  private subscribers = new Set<Subscriber>()
  private startTime = performance.now()
  private rafId: number | null = null

  constructor() {
    this.loop = this.loop.bind(this)
    this.rafId = requestAnimationFrame(this.loop)
  }

  private loop() {
    const elapsed = (performance.now() - this.startTime) / 1000
    this.subscribers.forEach((cb) => cb(elapsed))
    this.rafId = requestAnimationFrame(this.loop)
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  reset() {
    this.startTime = performance.now()
  }

  dispose() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.subscribers.clear()
  }
}

export const shaderClock = new ShaderClock()

/**
 * 在组件挂载时订阅 ShaderClock
 * @returns 一个函数，用于取消订阅 ShaderClock
 */
export function shaderListener(onTick: (elapsed: number) => void) {
  const unsub = shaderClock.subscribe(onTick)
  return () => unsub()
}
