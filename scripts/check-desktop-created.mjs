import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const runCapture = promisify(execFile)
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export default async function check({ host, application, storageFile, directory, router }) {
  const checks = []
  const record = (name) => {
    checks.push(name)
    console.log(name)
  }
  const tick = () => delay(150)
  const capture = async (name) => {
    const output = resolve(dirname(process.env.MAVIS_DESKTOP_REPORT), `${name}.png`)
    await mkdir(dirname(output), { recursive: true })
    if (windows)
      await runCapture('pwsh', [
        '-NoProfile',
        '-File',
        resolve(dirname(fileURLToPath(import.meta.url)), 'capture-desktop-window.ps1'),
        '-WindowHandle',
        String(host.window.hwnd),
        '-Output',
        output,
      ])
    else
      await runCapture('/usr/sbin/screencapture', [
        '-x',
        '-o',
        '-l',
        String(host.window.windowNumber),
        output,
      ])
  }
  const byId = (id) => [...host.nodes].find((node) => node.props.id === id)
  const windows = process.platform === 'win32'
  const api = windows
    ? createRequire(resolve(process.cwd(), 'package.json'))('@nativescript/windows-napi').Windows
    : null
  async function click(id) {
    const node = byId(id)
    assert(node?.native, `Missing native control ${id}`)
    if (windows) {
      const peer = new api.UI.Xaml.Automation.Peers.ButtonAutomationPeer(node.native)
      peer.GetPattern(api.UI.Xaml.Automation.Peers.PatternInterface.Invoke).Invoke()
    } else node.native.performClick(null)
    await tick()
  }
  async function type(id, value) {
    const node = byId(id)
    assert(node?.editor, `Missing native editor ${id}`)
    if (windows) node.editor.Text = value
    else {
      host.window.makeFirstResponder(node.editor)
      const editor = node.editor.currentEditor()
      assert(editor, 'Native text editor owns focus')
      editor.selectAll(null)
      editor.insertText(value)
    }
    await tick()
  }
  try {
    await tick()
    assert(windows ? host.window.visible : host.window.visible)
    record('Generated native window is visible')
    const field = byId(directory ? 'directory-search' : 'project-name')
    assert(windows ? field.editor.ActualWidth > 0 : field.editor.frame.size.width > 0)
    record('Generated native input has measured geometry')
    if (windows) {
      const geometry = [...host.nodes]
        .filter((n) => n.native)
        .map((n) => ({
          kind: n.kind,
          id: n.props.id,
          parent: n.parent?.kind,
          width: n.native.Width,
          height: n.native.Height,
          actualWidth: n.native.ActualWidth,
          actualHeight: n.native.ActualHeight,
          visibility: n.native.Visibility,
          opacity: n.native.Opacity,
          children: n.content?.Children?.Size,
          point: n.native.TransformToVisual(host.root.native).TransformPoint({ X: 0, Y: 0 }),
        }))
      await mkdir(dirname(process.env.MAVIS_DESKTOP_REPORT), { recursive: true })
      await writeFile(
        resolve(dirname(process.env.MAVIS_DESKTOP_REPORT), 'geometry.json'),
        JSON.stringify(geometry, null, 2),
      )
      console.log('Native geometry', JSON.stringify(geometry))
    }
    if (process.env.MAVIS_DESKTOP_CAPTURE) await capture('initial')
    if (directory) {
      assert(byId('entry-library'))
      await type('directory-search', 'Library')
      assert.equal(directory.query.value, 'Library')
      assert.equal([...host.nodes].filter((node) => node.kind === 'card').length, 1)
      record('Native input filters shared Directory state')
      await click('entry-library')
      assert.equal(router.currentRoute.value.path, '/entries/library')
      await click('edit-place')
      assert.equal(router.currentRoute.value.path, '/entries/library/edit')
      record('Native buttons navigate shared routes')
      await type('place-name', 'Native desktop library')
      await click('save-place')
      for (
        let i = 0;
        i < 30 && !directory.entries.value.some((e) => e.name === 'Native desktop library');
        i++
      )
        await tick()
      assert(directory.entries.value.some((e) => e.name === 'Native desktop library'))
      assert((await readFile(storageFile, 'utf8')).includes('Native desktop library'))
      record('Native editing commits through the host persistence service')
      assert([...host.nodes].some((n) => n.kind === 'reveal' && n.shown))
      record('Saved reveal becomes visible')
      await router.push('/')
      await tick()
      await type('directory-search', '')
      assert(byId('entry-library'))
      record('Navigation remounts the native screen without stale input state')
    } else {
      await type('project-name', 'Native desktop project')
      assert.equal(
        windows ? byId('greeting').native.Text : byId('greeting').native.stringValue,
        'Native desktop project',
      )
      record('Native input updates shared Vue state')
      await click('increment')
      assert.equal(byId('increment').props.text, 'Count 1')
      record('Native button updates shared Vue state')
      await click('save-project')
      for (let i = 0; i < 30 && ![...host.nodes].some((n) => n.kind === 'reveal' && n.shown); i++)
        await tick()
      assert.equal(await readFile(storageFile, 'utf8'), 'Native desktop project')
      record('Native save action writes through the application service')
      assert([...host.nodes].some((n) => n.kind === 'reveal' && n.shown))
      record('Saved reveal becomes visible')
    }
    host.setTheme(true)
    await tick()
    record('Native dark appearance applied')
    if (process.env.MAVIS_DESKTOP_CAPTURE) await capture('dark')
    host.close()
    await tick()
    assert.equal(host.closed, true)
    assert.equal(host.nodes.size, 0)
    record('Closing unmounts the Vue tree and releases native listeners')
    await mkdir(resolve(process.env.MAVIS_DESKTOP_REPORT, '..'), { recursive: true })
    await writeFile(
      process.env.MAVIS_DESKTOP_REPORT,
      JSON.stringify(
        {
          platform: process.platform,
          input: 'native control events; not physical pointer acceptance',
          checks,
        },
        null,
        2,
      ),
    )
  } finally {
    if (!host.closed) {
      application.unmount()
      host.close()
      host.stop()
    }
  }
}
