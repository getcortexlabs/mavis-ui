import { it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error Experimental compiler source.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

it.skipIf(process.platform !== 'darwin')(
  'restores the modal opener without showing a window and cancels stale restorations',
  async () => {
    const { swift } = await compileProject(
      new Map([
        [
          'shared/Home.lite.tsx',
          'export default function Home() { return <MSheet title="Edit" /> }',
        ],
      ]),
      { root: 'Home' },
    )
    const controls = swift.get('MavisControls.swift') as string
    const start = controls.indexOf('final class MavisModalFocus {')
    const end = controls.indexOf('/// Where a layer is written.', start)
    expect(start).toBeGreaterThan(0)
    expect(end).toBeGreaterThan(start)
    const folder = mkdtempSync(join(tmpdir(), 'mavis-modal-focus-'))
    try {
      writeFileSync(
        join(folder, 'main.swift'),
        `import AppKit
${controls.slice(start, end)}
final class FocusView: NSView {
    override var acceptsFirstResponder: Bool { true }
}
let application = NSApplication.shared
let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 200, height: 200), styleMask: [.titled], backing: .buffered, defer: false)
let content = window.contentView!
let opener = FocusView(frame: NSRect(x: 0, y: 0, width: 40, height: 40))
let modal = FocusView(frame: NSRect(x: 50, y: 0, width: 40, height: 40))
content.addSubview(opener)
content.addSubview(modal)
func settle() { RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.02)) }
let focus = MavisModalFocus()
precondition(!window.isVisible)
precondition(window.makeFirstResponder(opener))
focus.capture(content)
precondition(window.makeFirstResponder(modal))
focus.restore()
settle()
precondition(window.firstResponder === opener, "Closing restores the opener")

focus.capture(content)
precondition(window.makeFirstResponder(modal))
focus.restore()
focus.capture(content)
settle()
precondition(window.firstResponder === modal, "Reopening cancels pending restore")
focus.restore()
settle()
precondition(window.firstResponder === opener, "Reopening retains original opener")

focus.capture(content)
precondition(window.makeFirstResponder(modal))
opener.removeFromSuperview()
focus.restore()
settle()
precondition(window.firstResponder === modal, "Removed opener must not steal focus")
precondition(!window.isVisible)
print("passed")
`,
      )
      execFileSync('swiftc', ['main.swift', '-o', 'focus'], { cwd: folder, stdio: 'pipe' })
      expect(execFileSync(join(folder, 'focus'), { encoding: 'utf8' }).trim()).toBe('passed')
    } finally {
      rmSync(folder, { recursive: true, force: true })
    }
  },
  120_000,
)
