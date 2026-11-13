// Published civil-date helpers in shared modules. Civil dates have no clock or time zone;
// the existing Mac calendar policy supplies the exact Gregorian arithmetic.
import ts from 'typescript'
import { T } from '../model.mjs'

export const dateHelpers = {
  isCivilDate: { params: [T.string], returns: T.boolean },
  daysInMonth: { params: [T.number, T.number], returns: T.number },
  civilDate: { params: [T.string], returns: T.string, throws: true },
  civilWeekday: { params: [T.string], returns: T.number, throws: true },
  addCivilDays: { params: [T.string, T.number], returns: T.string, throws: true },
  addCivilMonths: { params: [T.string, T.number], returns: T.string, throws: true },
}
export const dateTypes = ['CivilDate']
export const dateHelperAmbient = `type __MavisSharedCivilDate = CivilDate
declare module '@getcortexlabs/mavis-core' {
  export type CivilDate = __MavisSharedCivilDate
  export function isCivilDate(value: unknown): value is CivilDate
  export function daysInMonth(year: number, month: number): number
  export function civilDate(value: string): CivilDate
  export function civilWeekday(value: CivilDate): number
  export function addCivilDays(value: CivilDate, amount: number): CivilDate
  export function addCivilMonths(value: CivilDate, amount: number): CivilDate
}`

export function dateHelperCall(node, ctx, { checker, args, fail }) {
  if (!ts.isIdentifier(node.expression)) return undefined
  const imported = checker.getSymbolAtLocation(node.expression)?.declarations?.[0]
  if (!imported || !ts.isImportSpecifier(imported)) return undefined
  const from = imported.parent.parent.parent.moduleSpecifier?.text
  const name = (imported.propertyName ?? imported.name).text
  if (from !== '@getcortexlabs/mavis-core' || !Object.hasOwn(dateHelpers, name)) return undefined
  const helper = dateHelpers[name]
  if (helper.throws && ctx.dateHelperClosure)
    fail(
      node,
      `${name} can throw inside this array callback. Put the try/catch in a shared function and call that function from the callback.`,
    )
  if (helper.throws && ctx.mode !== 'function')
    fail(
      node,
      `${name} belongs in a shared calculation with try/catch; call that function from the screen or store.`,
    )
  if (helper.throws && !ctx.failing)
    fail(
      node,
      `${name} can reject invalid dates or offsets. Call it inside try/catch so every target preserves the failure.`,
    )
  return {
    e: 'date-helper',
    name,
    args: args(node, node.arguments, helper.params, ctx),
    type: helper.returns,
    ...(helper.throws ? { throws: true } : {}),
  }
}
