import {
  Application,
  File,
  knownFolders,
  path,
  type View,
  type Button,
  type TextField,
  type Label,
} from '@nativescript/core'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { bridge, theme, lifecycle } from './_model'

declare const __FRAMEWORK__: string
const wait = (time = 100) => new Promise<void>((resolve) => setTimeout(resolve, time))
const report = {
  framework: __FRAMEWORK__,
  done: false,
  checks: [] as string[],
  failures: [] as string[],
  lifecycle,
}
function assert(value: unknown, message: string) {
  if (!value) throw new Error(message)
  report.checks.push(message)
}
function write() {
  File.fromPath(path.join(knownFolders.documents().path, 'adapter-check.json')).writeTextSync(
    JSON.stringify(report),
  )
}
function find<T extends View>(id: string): T {
  const view = Application.getRootView()?.getViewById<T>(id)
  if (!view) throw new Error(`Missing ${id}`)
  return view
}
const color = (view: Label) => view.color.hex.toLowerCase().slice(-6)
const hex = (value: string) => value.toLowerCase().slice(-6)
function nativeClick(button: Button) {
  if (button.android) button.android.performClick()
  else button.ios.sendActionsForControlEvents(UIControlEvents.TouchUpInside)
}
async function check() {
  try {
    for (
      let i = 0;
      i < 100 &&
      (!bridge.read ||
        !bridge.dispose ||
        !Application.getRootView()?.getViewById('action')?.isLoaded);
      i++
    )
      await wait()
    if (!bridge.read || !bridge.update || !bridge.dispose || !bridge.focus)
      throw new Error('Framework did not mount')
    report.checks.push('framework mounted and exposed its state/lifecycle')
    const button = find<Button>('action'),
      editor = find<TextField>('editor')
    const heading = find<Label>('heading'),
      isolated = find<Label>('isolated')
    for (let i = 0; i < 100 && (!button.isLayoutValid || button.getActualSize().height <= 0); i++)
      await wait(50)
    assert(editor.text === 'Ada', 'initial controlled model rendered')
    assert(button.text === 'Count 0', 'text composition rendered')
    assert(button.getActualSize().height >= 44, 'native button touch target measured')
    assert(
      find('row').getActualSize().width > 0 && find('catalog').getActualSize().height > 0,
      'native row and column measured',
    )
    await wait(200)
    assert(
      lifecycle.active === 1 && lifecycle.animations >= 1,
      'native Jolt surface mounted and completed its animation',
    )
    nativeClick(button)
    await wait()
    assert(
      bridge.read().count === 1 && button.text === 'Count 1',
      'native button activation updated framework state',
    )
    editor.text = 'Grace'
    await wait()
    assert(bridge.read().value === 'Grace', 'native editor requested and owner accepted a value')
    bridge.update({ value: 'Lin' })
    await wait()
    assert(
      editor.text === 'Lin' && find('editor') === editor,
      'parent update preserved native editor identity',
    )
    bridge.focus()
    await wait(200)
    assert(
      editor.android ? editor.android.hasFocus() : editor.ios.isFirstResponder,
      'portable focus intention reached the native editor',
    )
    editor.dismissSoftInput()
    bridge.update({ disabled: true })
    await wait()
    assert(!button.isEnabled && !editor.editable, 'disabled props reached native controls')
    button.notify({ eventName: 'tap', object: button })
    await wait()
    assert(bridge.read().count === 1, 'disabled action was rejected')
    bridge.update({ disabled: false, loading: true })
    await wait()
    assert(
      button.text === 'Loading…' && !button.isEnabled,
      'loading button kept its accessible text and blocked activation',
    )
    bridge.update({ loading: false })
    await wait()
    assert(
      color(heading) === hex(mavis.colors.text) && color(isolated) === hex(midnight.colors.text),
      'theme scopes started independently',
    )
    await wait(700)
    theme.setTheme(midnight)
    await wait()
    assert(
      color(heading) === hex(midnight.colors.text),
      'theme change repainted an existing native view',
    )
    await wait(700)
    theme.setTheme(mavis)
    await wait()
    assert(color(isolated) === hex(midnight.colors.text), 'another scope retained its theme')
    bridge.update({ visible: false })
    await wait()
    assert(lifecycle.active === 0, 'framework removal released the Jolt surface')
    bridge.update({ visible: true })
    await wait(200)
    assert(
      lifecycle.active === 1 && lifecycle.attached === 2,
      'framework remount reacquired the surface exactly once',
    )
    bridge.dispose()
    await wait()
    assert(lifecycle.active === 0, 'framework disposal released every surface')
  } catch (error) {
    report.failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error))
  } finally {
    report.done = true
    write()
  }
}
export function beginAcceptance() {
  write()
  Application.on(Application.launchEvent, () => {
    void check()
  })
  Application.on(Application.uncaughtErrorEvent, (event: any) => {
    report.failures.push(String(event.error?.stack ?? event.error))
    report.done = true
    write()
  })
}
