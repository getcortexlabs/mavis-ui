import {
  Application,
  Device,
  GestureTypes,
  Screen,
  View,
  knownFolders,
  isIOS,
  type ViewBase,
} from '@nativescript/core'
import { configurePerformance } from '../shared/checks/performance/run'
import { router } from './router'

declare function CACurrentMediaTime(): number
declare const __PERFORMANCE_SUITE__: string
declare const java: { lang: { System: { nanoTime(): number } } }
declare const android: { os: { Debug: { getRuntimeStat(name: string): string | null } } }

function views() {
  const result: View[] = []
  function visit(view: ViewBase) {
    if (view instanceof View) result.push(view)
    view.eachChild((child) => {
      visit(child)
      return true
    })
  }
  const root = Application.getRootView()
  if (root) visit(root)
  return result
}
function find(id: string) {
  const view = views().find((view) => view.id === id)
  if (!view) throw new Error(`Missing ${id}`)
  return view
}

// This module and its shared fixture are excluded from ordinary builds.
let pressed: View | undefined
let lastStage = ''
configurePerformance({
  environment: {
    renderer: isIOS ? 'ios' : 'android',
    suite: __PERFORMANCE_SUITE__,
    model: Device.model,
    os: Device.osVersion,
    screen: { width: Screen.mainScreen.widthDIPs, height: Screen.mainScreen.heightDIPs },
    build: 'debug',
    core: '9.1.3',
    jolt: '0.1.0-rc.1',
  },
  now: () => (isIOS ? CACurrentMediaTime() * 1000 : Number(java.lang.System.nanoTime()) / 1e6),
  allocatedBytes: isIOS
    ? undefined
    : () => {
        const value = android.os.Debug.getRuntimeStat('art.gc.bytes-allocated')
        return value === null ? undefined : Number(value)
      },
  frame: () => new Promise((resolve) => requestAnimationFrame(resolve)),
  write(report) {
    knownFolders.documents().getFile('performance-check.json').writeTextSync(JSON.stringify(report))
    if (report.stage !== lastStage || report.error) {
      console.log(`MAVIS_PERFORMANCE ${report.stage}${report.error ? ` ${report.error}` : ''}`)
      lastStage = report.stage
    }
  },
  navigate: async (path) => {
    await router.push(path)
  },
  back: async () => {
    await router.back()
  },
  slider(value) {
    const view = find('performance-slider')
    view.set('value', value)
  },
  press(down) {
    const view = down ? find('performance-press') : pressed
    if (!view) throw new Error('Missing pressed view')
    pressed = down ? view : undefined
    const observers = view.getGestureObservers(GestureTypes.touch) ?? []
    if (down && !observers.length) throw new Error('Missing press observer')
    for (const observer of observers)
      observer.callback.call(observer.context, {
        eventName: 'touch',
        object: view,
        action: down ? 'down' : 'up',
      } as never)
  },
  capture(route = false) {
    const captured = views().filter((view) =>
      route
        ? (view.getGestureObservers(GestureTypes.touch)?.length ?? 0) > 0
        : view.id?.startsWith('performance-button-') || view.id === 'performance-press',
    )
    return () => ({
      captured: captured.length,
      loaded: captured.filter((view) => view.isLoaded).length,
      touchObservers: captured.reduce(
        (count, view) => count + (view.getGestureObservers(GestureTypes.touch)?.length ?? 0),
        0,
      ),
      unrestoredScale: captured.filter(
        (view) => Math.abs(view.scaleX - 1) > 0.001 || Math.abs(view.scaleY - 1) > 0.001,
      ).length,
    })
  },
  async idle() {
    const current = views()
    let layouts = 0
    const changed = () => layouts++
    for (const view of current) view.on('layoutChanged', changed)
    await new Promise((resolve) => setTimeout(resolve, 750))
    for (const view of current) view.off('layoutChanged', changed)
    return {
      duration: 750,
      views: current.length,
      viewsAfter: views().length,
      layoutEvents: layouts,
    }
  },
})
