import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { nextTick } from 'vue'
import { opacityMotion } from './motion.mjs'

export async function checkDirectory({
  host,
  directory,
  router,
  storageFile,
  hostOnly,
  failWrite,
}) {
  const report = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    runtime: '0.5.0-beta.0',
    jolt: '0.1.0-rc.16',
    checks: [],
    input: hostOnly
      ? 'Native control actions/editor; not UI acceptance'
      : 'AppKit event queue and native text editor; no physical pointer claim',
  }
  const record = (name) => {
    report.checks.push(name)
    console.log(`AppKit: ${name}`)
  }
  const tick = async () => {
    await nextTick()
    await delay(70)
  }
  const byId = (id) => [...host.nodes].find((node) => node.props.id === id)
  const click = async (id) => {
    const view = byId(id)?.native
    assert.ok(view, `Missing native control ${id}`)
    assert.ok(view.window, `Detached native control ${id}`)
    assert.ok(byId(id).delegate.respondsToSelector('activate'), 'Unregistered native action')
    if (hostOnly) {
      view.performClick(null)
      await tick()
      return
    }
    host.window.makeKeyWindow()
    assert.ok(
      host.window.keyWindow && host.window.windowNumber > 0,
      'Native UI acceptance requires a WindowServer session where the app can become key; use check:host only for the separate control-action probe.',
    )
    const point = view.convertPointToView(
      { x: view.bounds.size.width / 2, y: view.bounds.size.height / 2 },
      null,
    )
    // Both events are enqueued before AppKit enters NSButton's tracking loop.
    for (const type of [NSEventType.LeftMouseDown, NSEventType.LeftMouseUp]) {
      const event =
        NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(
          type,
          point,
          0,
          NSProcessInfo.processInfo.systemUptime,
          host.window.windowNumber,
          null,
          0,
          1,
          1,
        )
      NSApplication.sharedApplication.postEventAtStart(event, false)
    }
    await tick()
  }
  const type = async (id, value) => {
    const node = byId(id)
    assert.ok(node?.editor, `Missing editor ${id}`)
    host.window.makeFirstResponder(node.editor)
    const editor = node.editor.currentEditor()
    assert.ok(editor, 'Native field editor did not become first responder')
    if (hostOnly) {
      editor.selectAll(null)
      editor.insertText(value)
    } else {
      assert.ok(
        host.window.keyWindow && host.window.windowNumber > 0,
        'Native input needs a WindowServer session',
      )
      for (const [characters, flags] of [
        ['a', NSEventModifierFlags.Command],
        ...[...value].map((char) => [char, 0]),
      ])
        for (const eventType of [NSEventType.KeyDown, NSEventType.KeyUp])
          NSApplication.sharedApplication.postEventAtStart(
            NSEvent.keyEventWithTypeLocationModifierFlagsTimestampWindowNumberContextCharactersCharactersIgnoringModifiersIsARepeatKeyCode(
              eventType,
              { x: 0, y: 0 },
              flags,
              NSProcessInfo.processInfo.systemUptime,
              host.window.windowNumber,
              null,
              characters,
              characters,
              false,
              0,
            ),
            false,
          )
    }
    await tick()
  }
  await tick()
  assert.equal(directory.entries.value.length, 3)
  await type('directory-search', 'Porto')
  assert.equal(directory.query.value, 'Porto')
  assert.ok(byId('entry-garden'))
  assert.equal(byId('entry-library'), undefined)
  record('native editor updates the unchanged shared Vue search/store')
  const field = byId('directory-search').editor
  host.window.setContentSize({ width: 440, height: 520 })
  host.setTheme(true)
  await tick()
  assert.equal(byId('directory-search').editor, field)
  assert.equal(field.stringValue, 'Porto')
  record('resize and theme retain the editor and search state')
  await click('entry-garden')
  assert.equal(router.currentRoute.value.path, '/entries/garden')
  await click('edit-place')
  assert.equal(router.currentRoute.value.path, '/entries/garden/edit')
  record(`${hostOnly ? 'Native actions' : 'AppKit mouse events'} open shared details/edit routes`)
  await type('place-name', 'AppKit community garden')
  failWrite()
  await click('save-place')
  assert.ok(byId('save-error'))
  assert.equal(byId('place-name').editor.stringValue, 'AppKit community garden')
  record('failed async save retains the draft and renders the shared error')
  await click('save-place')
  assert.equal(byId('save-error'), undefined)
  assert.equal(
    directory.entries.value.find((entry) => entry.id === 'garden').name,
    'AppKit community garden',
  )
  assert.equal(
    JSON.parse(await readFile(storageFile, 'utf8')).find((entry) => entry.id === 'garden').name,
    'AppKit community garden',
  )
  record('successful async save commits through the existing host storage service')
  const reveal = [...host.nodes].find((node) => node.kind === 'reveal')
  assert.ok(reveal?.shown)
  await delay(300)
  if (!hostOnly) assert.equal(reveal.motion.active, false)
  if (!hostOnly) {
    let finished
    const playback = opacityMotion(reveal.native, 0, 1, false, (value) => {
      finished = value
    })
    assert.ok(reveal.native.layer.animationForKey('mavis:jolt:opacity'))
    playback.cancel()
    assert.equal(finished, false)
    assert.equal(reveal.native.layer.animationForKey('mavis:jolt:opacity'), null)
  }
  const reduced = opacityMotion(reveal.native, 0, 1, true)
  assert.equal(reduced.active, false)
  assert.equal(reveal.native.layer.opacity, 1)
  record(
    hostOnly
      ? 'reduced-motion resting pose (timed Core Animation requires native acceptance)'
      : 'Jolt-sampled Core Animation completes, cancels and honors reduced motion',
  )
  await router.push('/')
  await tick()
  assert.equal(directory.query.value, 'Porto')
  assert.equal(host.nodes.has(reveal), false)
  record('navigation releases native views, delegates and reveal playback')
  if (!hostOnly) {
    const sheet = host.openInfoSheet()
    await tick()
    assert.equal(host.window.attachedSheet, sheet.window)
    host.window.endSheetReturnCode(sheet.window, NSModalResponseCancel)
    await delay(400)
    assert.equal(host.sheets.size, 0)
    record('native sheet presentation and cancellation release their owner')
  }
  await mkdir('artifacts', { recursive: true })
  await writeFile(
    `artifacts/appkit-${hostOnly ? 'host' : 'native'}-check.json`,
    JSON.stringify(report, null, 2) + '\n',
  )
}
