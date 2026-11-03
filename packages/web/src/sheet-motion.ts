import { createWebRuntime, type WebBottomSheet } from '@rafaelaugusto/jolt/web'

/** Jolt owns snap geometry, keyboard placement, gestures and nested-scroll handoff. */
export function sheetMotion(
  dialog: HTMLDialogElement,
  panel: HTMLElement,
  handle: HTMLElement,
  options: () => { dismissible: boolean; fullscreen: boolean; label: string },
  closed: () => void,
  swiped: () => void,
) {
  const runtime = createWebRuntime(panel.ownerDocument)
  const content = panel.querySelector<HTMLElement>('.m-sheet-content')!
  const scrollView = panel.querySelector<HTMLElement>('.m-sheet-body')!
  let sheet: WebBottomSheet | undefined,
    disposed = false,
    open = true,
    settledClosed = false
  let configuration = ''
  const attach = () => {
    const settings = options()
    configuration = JSON.stringify(settings)
    sheet?.dispose()
    sheet = runtime.bottomSheet(panel, {
      host: dialog,
      handle,
      content,
      scrollView,
      snap: [settings.fullscreen ? '100%' : 'content'],
      safeArea: { top: settings.fullscreen ? 0 : 24 },
      dismissible: settings.dismissible,
      label: settings.label,
      spring: { duration: 420, bounce: 0 },
      onDismiss() {
        settledClosed = true
        if (disposed) return
        if (open) swiped()
        else closed()
      },
    })
    dialog.dataset.motion = 'jolt-bottom-sheet'
  }
  try {
    attach()
  } catch {
    sheet?.dispose()
    runtime.dispose()
    dialog.dataset.motion = 'static'
  }
  return {
    show() {
      if (disposed) return
      open = true
      settledClosed = false
      sheet?.open()
    },
    hide() {
      if (disposed) return
      open = false
      // Jolt's non-dismissible Web controller also rejects programmatic dismiss.
      // Removing this presentation remains Mavis's responsibility.
      if (!sheet || !options().dismissible || settledClosed) closed()
      else sheet.dismiss()
    },
    refresh() {
      if (disposed || !sheet) return
      if (JSON.stringify(options()) !== configuration) {
        attach()
        if (open) sheet!.open()
      } else sheet.remeasure()
    },
    dispose() {
      if (disposed) return
      disposed = true
      sheet?.dispose()
      runtime.dispose()
      delete dialog.dataset.motion
    },
  }
}
