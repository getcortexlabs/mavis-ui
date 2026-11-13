import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { swipeDestination } from '../packages/core/src/interactive'
import { deckDecision } from '../packages/core/src/creative-controls'
import {
  moveKanban,
  validateKanban,
  type KanbanCard,
  type KanbanColumn,
} from '../packages/core/src/dashboard'
// @ts-expect-error Compiler source is shipped as JavaScript in the template.
import { swipeActionsPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/swipe-actions.mjs'
// @ts-expect-error Compiler source is shipped as JavaScript in the template.
import { swipeDeckPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/swipe-deck.mjs'
// @ts-expect-error Compiler source is shipped as JavaScript in the template.
import { kanbanPolicy } from '../packages/create-mavis/templates/macos/scripts/portable/components/kanban.mjs'

const swift = process.platform === 'darwin' && spawnSync('swiftc', ['--version']).status === 0
const root = new URL('..', import.meta.url).pathname
const text = (value: string) => JSON.stringify(value)
const number = (value: number) =>
  Number.isNaN(value)
    ? 'Double.nan'
    : !Number.isFinite(value)
      ? `${value < 0 ? '-' : ''}Double.infinity`
      : `${value}${Number.isInteger(value) ? '.0' : ''}`
const attempt = (run: () => unknown) => {
  try {
    return run()
  } catch {
    return null
  }
}
function ports(calls: string[]): unknown[] {
  const source = `import Foundation\n${swipeActionsPolicy}\n${swipeDeckPolicy}\n${kanbanPolicy}\n
func kanban(_ columns: [MavisKanbanColumnData], _ cards: [MavisKanbanCardData], _ id: String, _ to: String, _ before: String?) -> Any {
    guard let result = mavisKanbanMove(columns, cards, id: id, to: to, before: before) else { return NSNull() }
    return ["order": result.order, "move": ["id": result.move.id, "from": result.move.from, "to": result.move.to, "before": result.move.before.map { $0 as Any } ?? NSNull()]] as [String: Any]
}
func show(_ value: Any) { print(String(data: try! JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed, .sortedKeys]), encoding: .utf8)!) }
${calls.map((call) => `show(${call})`).join('\n')}\n`
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 20)
  const directory = join(root, 'artifacts/portable/list-policies', hash)
  const binary = join(directory, 'policies')
  if (!existsSync(binary)) {
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'main.swift'), source)
    execFileSync('swiftc', ['main.swift', '-o', 'policies'], {
      cwd: directory,
      stdio: 'pipe',
      timeout: 90_000,
    })
  }
  return execFileSync(binary, { encoding: 'utf8', timeout: 10_000 })
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
}

describe('Mac list policy parity with the shared core', () => {
  it.runIf(swift)(
    'agrees on directional swipe thresholds, velocity, deck cancellation and Kanban capacity/order',
    () => {
      const calls: string[] = [],
        expected: unknown[] = []
      for (const direction of [-1, 1])
        for (const x of [-120, -43.2, -12, 0, 12, 43.2, 120])
          for (const velocity of [-800, 0, 800]) {
            calls.push(
              `mavisSwipeDestination(${number(x)}, ${number(velocity)}, 96, 192, ${number(direction)}).map { $0 as Any } ?? NSNull()`,
            )
            expected.push(swipeDestination(x, velocity, 96, 192, direction))
          }
      for (const x of [-90, -13, -12, 0, 12, 13, 90])
        for (const velocity of [-601, -600, 0, 600, 601]) {
          calls.push(
            `mavisDeckDecision(${number(x)}, ${number(velocity)}, 90).map { $0 as Any } ?? NSNull()`,
          )
          expected.push(deckDecision(x, velocity, 90))
        }
      const columns: KanbanColumn[] = [
        { id: 'todo', title: 'To do' },
        { id: 'done', title: 'Done', limit: 1 },
      ]
      const cards: KanbanCard[] = [
        { id: 'a', title: 'A', column: 'todo' },
        { id: 'b', title: 'B', column: 'todo' },
        { id: 'c', title: 'Hidden C', column: 'done' },
        { id: 'd', title: 'Locked D', column: 'todo', disabled: true },
      ]
      const cols = (items: KanbanColumn[]) =>
        `[${items.map((item) => `MavisKanbanColumnData(id: ${text(item.id)}, title: ${text(item.title)}, limit: ${item.limit === undefined ? 'nil' : number(item.limit)})`).join(', ')}]`
      const rows = (items: KanbanCard[]) =>
        `[${items.map((item) => `MavisKanbanCardData(id: ${text(item.id)}, column: ${text(item.column)}, title: ${text(item.title)}, disabled: ${Boolean(item.disabled)})`).join(', ')}]`
      for (const id of ['a', 'c', 'd', 'missing'])
        for (const to of ['todo', 'done', 'missing'])
          for (const before of [null, 'a', 'b', 'c', 'missing']) {
            calls.push(
              `kanban(${cols(columns)}, ${rows(cards)}, ${text(id)}, ${text(to)}, ${before === null ? 'nil' : text(before)})`,
            )
            const result = moveKanban(columns, cards, id, to, before)
            expected.push(
              result ? { order: result.cards.map((card) => card.id), move: result.move } : null,
            )
          }
      for (const [badColumns, badCards] of [
        [[], cards],
        [columns, [...cards, cards[0]!]],
        [[{ id: 'a', title: 'A', limit: 0 }], []],
        [columns, [{ id: 'a', title: '', column: 'todo' }]],
      ] as [KanbanColumn[], KanbanCard[]][]) {
        calls.push(`mavisKanbanValid(${cols(badColumns)}, ${rows(badCards)})`)
        expected.push(
          attempt(() => {
            validateKanban(badColumns, badCards)
            return true
          }) ?? false,
        )
      }
      expect(ports(calls)).toEqual(expected)
    },
    120_000,
  )
})
