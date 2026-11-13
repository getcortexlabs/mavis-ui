import { it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error Experimental compiler source.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

it.skipIf(process.platform !== 'darwin')(
  'routes secondary menu presses only inside the enabled trigger in its own window',
  async () => {
    const { swift } = await compileProject(
      new Map([
        [
          'shared/Home.lite.tsx',
          'export default function Home() { return <MMenu label="Actions" triggerLabel="Actions" items={[]} /> }',
        ],
      ]),
      { root: 'Home' },
    )
    const controls = swift.get('MavisControls.swift') as string
    const start = controls.indexOf('private struct MavisMenuContextTrigger:')
    const end = controls.indexOf('/// MMenu: the popover', start)
    expect(start).toBeGreaterThan(0)
    expect(end).toBeGreaterThan(start)
    const folder = mkdtempSync(join(tmpdir(), 'mavis-menu-context-'))
    try {
      writeFileSync(
        join(folder, 'main.swift'),
        `import AppKit
import SwiftUI
${controls.slice(start, end)}
MainActor.assumeIsolated {
let application = NSApplication.shared
let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 200, height: 200), styleMask: [.titled], backing: .buffered, defer: false)
let other = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 200, height: 200), styleMask: [.titled], backing: .buffered, defer: false)
let reader = MavisMenuContextTrigger.Reader(frame: NSRect(x: 10, y: 10, width: 40, height: 40))
window.contentView!.addSubview(reader)
let coordinator = MavisMenuContextTrigger.Coordinator()
coordinator.view = reader
coordinator.enabled = true
var requests = 0
coordinator.action = { requests += 1 }
func event(_ type: NSEvent.EventType = .rightMouseDown, x: CGFloat = 20, control: Bool = false, inWindow: NSWindow = window) -> NSEvent {
    NSEvent.mouseEvent(with: type, location: NSPoint(x: x, y: 20), modifierFlags: control ? [.control] : [], timestamp: 0, windowNumber: inWindow.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: 1)!
}
precondition(reader.hitTest(NSPoint(x: 10, y: 10)) == nil)
precondition(coordinator.pressed(event()))
precondition(requests == 1)
precondition(!coordinator.pressed(event(.leftMouseDown)))
precondition(coordinator.pressed(event(.leftMouseDown, control: true)))
precondition(requests == 2)
precondition(!coordinator.pressed(event(x: 100)))
precondition(!coordinator.pressed(event(inWindow: other)))
coordinator.enabled = false
precondition(!coordinator.pressed(event()))
coordinator.enabled = true
MavisMenuContextTrigger.dismantleNSView(reader, coordinator: coordinator)
precondition(!coordinator.pressed(event()))
precondition(requests == 2)
precondition(!window.isVisible && !other.isVisible)
print("passed")
}
`,
      )
      execFileSync('swiftc', ['main.swift', '-o', 'context'], { cwd: folder, stdio: 'pipe' })
      expect(execFileSync(join(folder, 'context'), { encoding: 'utf8' }).trim()).toBe('passed')
    } finally {
      rmSync(folder, { recursive: true, force: true })
    }
  },
  120_000,
)
