import type { Router } from 'vue-router'
import {
  configurePerformance,
  type PerformanceReport,
} from '../../catalog/shared/checks/performance/run'

declare global {
  interface Window {
    mavisPerformance?: PerformanceReport
    mavisPerformancePress(down: boolean): Promise<void>
  }
}

export function setupPerformance(router: Router) {
  configurePerformance({
    environment: {
      renderer: 'web',
      suite: import.meta.env.VITE_PERFORMANCE_SUITE === 'catalog' ? 'catalog' : 'standard',
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight },
      motion: 'css',
      build: 'production',
    },
    now: () => performance.now(),
    frame: () => new Promise((resolve) => requestAnimationFrame(resolve)),
    write: (report) => {
      window.mavisPerformance = report
    },
    navigate: async (path) => {
      await router.push(path)
    },
    back: () =>
      new Promise((resolve) => {
        const remove = router.afterEach(() => {
          remove()
          resolve(undefined)
        })
        router.back()
      }),
    slider(value) {
      const input = document.getElementById('performance-slider') as HTMLInputElement
      input.value = String(value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
    // Real pointer input is supplied by Playwright; :active cannot be synthesized with dispatchEvent.
    press: (down) => window.mavisPerformancePress(down),
    capture(route = false) {
      const captured = [
        ...document.querySelectorAll(
          route
            ? '#app button, #app [role="button"]'
            : '[id^="performance-button-"], #performance-press',
        ),
      ]
      return () => ({
        captured: captured.length,
        connected: captured.filter((element) => element.isConnected).length,
        animations: captured.reduce(
          (count, element) =>
            count +
            element.getAnimations().filter((animation) => animation.playState === 'running').length,
          0,
        ),
      })
    },
    async idle() {
      const nodes = document.querySelectorAll('#app *').length
      let mutations = 0
      const observer = new MutationObserver((records) => {
        mutations += records.length
      })
      observer.observe(document.getElementById('app')!, {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true,
      })
      await new Promise((resolve) => setTimeout(resolve, 750))
      observer.disconnect()
      return {
        duration: 750,
        nodes,
        nodesAfter: document.querySelectorAll('#app *').length,
        mutations,
        animations: document
          .getAnimations()
          .filter((animation) => animation.playState === 'running').length,
      }
    },
  })
}
