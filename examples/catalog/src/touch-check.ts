import { Frame, View, ScrollView, Label, Screen, knownFolders, isIOS } from '@nativescript/core'

const errors: string[] = []
export const recordError = (error: unknown) => errors.push(String(error))
// Observations only: the external runner injects OS taps and swipes. No notify(),
// direct gesture callbacks, scrollTo or synthetic component activation here.
setInterval(() => {
  const page = Frame.topmost()?.currentPage
  if (!page) return
  const views: Record<string, unknown> = {}
  let scroll = 0
  const visit = (view: View) => {
    if (view instanceof ScrollView) scroll = view.verticalOffset
    if (view.id) {
      if (view.accessibilityIdentifier !== view.id) view.accessibilityIdentifier = view.id
      const rect = view.getLocationOnScreen()
      views[view.id] = {
        ...rect,
        ...view.getActualSize(),
        text: view instanceof Label ? view.text : undefined,
      }
    }
    view.eachChild((child) => {
      if (child instanceof View) visit(child)
      return true
    })
  }
  visit(page)
  knownFolders
    .documents()
    .getFile('touch-check.json')
    .writeTextSync(
      JSON.stringify({
        views,
        scroll,
        errors,
        scale: Screen.mainScreen.scale,
        platform: isIOS ? 'ios' : 'android',
      }),
    )
}, 200)
