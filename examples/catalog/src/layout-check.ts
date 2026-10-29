import { Application, View, knownFolders, isIOS, type ViewBase } from '@nativescript/core'
import { checkLayout, type Bounds } from '../../../test/layout-contract'

declare const __LAYOUT_ROTATE__: boolean
declare const UIWindowSceneGeometryPreferencesIOS: {
  alloc(): { initWithInterfaceOrientations(mask: number): unknown }
}

function rotate(landscape: boolean) {
  if (isIOS) {
    const preferences = UIWindowSceneGeometryPreferencesIOS.alloc().initWithInterfaceOrientations(
      landscape ? 24 : 2, // UIKit's landscape and portrait orientation masks.
    )
    Application.ios.window.windowScene.requestGeometryUpdateWithPreferencesErrorHandler(
      preferences,
      (error: { localizedDescription: string }) => console.error(error.localizedDescription),
    )
  } else {
    const activity = Application.android.foregroundActivity
    activity.setRequestedOrientation(landscape ? 0 : 1)
  }
}

// Included only by --env.layoutCheck; results stay in the app's documents directory.
let sample = 0
const samples: {
  sample: number
  rotate: boolean
  views: Record<string, Bounds>
  failures: string[]
}[] = []
const timer = setInterval(() => {
  const root = Application.getRootView()
  if (!root) return
  const views: Record<string, Bounds> = {}
  let action: View | undefined
  function visit(view: ViewBase) {
    if (view instanceof View && view.id && view.getLocationInWindow()) {
      views[view.id] = { ...view.getActualSize(), ...view.getLocationInWindow() }
      if (view.id === 'change-content') action = view
    }
    view.eachChild((child) => {
      visit(child)
      return true
    })
  }
  visit(root)
  let failures: string[]
  try {
    failures = checkLayout(views)
    if (sample >= 4) {
      for (const id of ['change-content', 'percent-row', 'grow-row', 'wrap-row', 'dynamic-card']) {
        if (Math.abs(views[id]!.height - samples[0]!.views[id]!.height) > 1) {
          failures.push(`${id} did not return to its original height`)
        }
      }
    }
  } catch (error) {
    failures = [String(error)]
  }
  samples.push({ sample, rotate: __LAYOUT_ROTATE__, views, failures })
  knownFolders.documents().getFile('layout-check.json').writeTextSync(JSON.stringify(samples))
  console.log('MAVIS_LAYOUT ' + JSON.stringify({ sample, failures }))
  if (sample === 1 || sample === 3) {
    action?.notify({ eventName: 'tap', object: action })
    if (__LAYOUT_ROTATE__) rotate(sample === 1)
  }
  if (++sample === 8) clearInterval(timer)
}, 2000)
