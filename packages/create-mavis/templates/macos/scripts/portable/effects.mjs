import { composableOf } from './components/index.mjs'
// What a component does when it appears, when it goes away and when a value changes: read by
// each front end with readEffects below, printed as SwiftUI modifiers and as Vue hooks.
import ts from 'typescript'
import { components } from './components/index.mjs'
import { primitive } from './model.mjs'
import { swiftType } from './swift-text.mjs'
import { js, statements } from './js-text.mjs'

/** The hooks each format writes, by what they become in the model. */
export const hooks = {
  onMounted: 'mount',
  onMount: 'mount',
  onUnmounted: 'unmount',
  onBeforeUnmount: 'unmount',
  onUnMount: 'unmount',
  watch: 'change',
}

/**
 * Reads one hook call into component.effects. source(node, ctx) answers what a watch observes
 * when node is a ref or a computed value of the component, or undefined; ctx is the scope a
 * function of the component reads in.
 */
export function readEffect(reader, component, call, within, source = () => undefined) {
  const { fail } = reader
  const on = hooks[call.expression.text]
  const [first, second, third] = call.arguments
  const callback = on === 'change' ? second : first
  if (
    !callback ||
    !ts.isArrowFunction(callback) ||
    (on === 'change' ? !first || third : second) ||
    callback.asteriskToken
  )
    fail(
      call,
      on === 'change'
        ? 'watch takes what to watch and what to do: watch(() => count.value, (value, before) => { … }). Options such as immediate and deep do not reach the Mac.'
        : `${call.expression.text} takes what to do: ${call.expression.text}(() => { … }).`,
    )
  const waits = Boolean(callback.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword))
  const effect = { on }
  let params = []
  if (on === 'change') {
    const pure = within('pure')
    effect.source =
      source(first, pure) ??
      (ts.isArrowFunction(first) && !first.parameters.length && !ts.isBlock(first.body)
        ? reader.expr(first.body, pure)
        : fail(
            first,
            'watch a ref or a computed value of this component, or a function that returns what to watch: watch(() => store.count.value, …).',
          ))
    const base = effect.source.type.k === 'optional' ? effect.source.type.of : effect.source.type
    // A list or a record changes inside without becoming another one: only Swift would notice.
    if (!primitive(base))
      fail(
        first,
        'watch a text, a number or a boolean. For a list or a record, watch what you need of it, such as () => items.value.length.',
      )
    params = [effect.source.type, effect.source.type]
  }
  const handled = reader.handler(callback, params, { ...within('action'), async: waits })
  reader.cannotFail(
    handled,
    component,
    callback,
    on === 'change' ? 'a watcher' : call.expression.text,
  )
  if (on === 'change') effect.params = handled.params
  effect.body = handled.body
  if (waits) effect.async = true
  ;(component.effects ??= []).push(effect)
}

/** The modifiers a component's root view takes for its effects, as lines. */
export function swiftEffects(emit, component, indent) {
  const pad = ' '.repeat(indent)
  const lines = []
  if (emit.contextTasks) {
    const effects = component.effects ?? []
    const call = (effect, index, by, args = []) => {
      const invoke = `context.mavisEffect${index}(${args.join(', ')})`
      return `${pad}${' '.repeat(by)}${effect.async ? `_Concurrency.Task { @MainActor in await ${invoke} }` : invoke}`
    }
    const updates = component.refs.some((ref) => ref.owner && composableOf(ref).update)
    const captures = [
      ...(component.props.length
        ? [
            'props = self.mavisProps',
            ...component.props.map((prop) => `${prop.name} = self.${prop.name}`),
          ]
        : []),
      ...(updates ? ['context = self.mavisContext'] : []),
    ]
    const refresh = captures.length
      ? `, update: { [${captures.join(', ')}] in ${[...component.props.map((prop) => `props.${prop.name} = ${prop.name}`), ...(updates ? ['context.mavisUpdateControllers()'] : [])].join('; ')} }`
      : ''
    lines.push(
      `${pad}.mavisComponentLifetime(self.mavisLifetime${refresh}) { [context = self.mavisContext] in`,
    )
    // Controller hooks use onBeforeUnmount; release them before user onUnmounted hooks.
    for (const reference of component.refs) {
      const dispose = reference.owner && composableOf(reference).dispose
      if (dispose) lines.push(`${pad}    ${dispose(reference, 'context')}`)
    }
    effects.forEach((effect, index) => {
      if (effect.on === 'unmount') lines.push(call(effect, index, 4))
    })
    lines.push(
      `${pad}}`,
      `${pad}.onAppear {`,
      ...(updates ? [`${pad}    self.mavisContext.mavisUpdateControllers()`] : []),
      `${pad}    self.mavisLifetime.appear { [context = self.mavisContext] in`,
    )
    effects.forEach((effect, index) => {
      if (effect.on === 'mount') lines.push(call(effect, index, 8))
    })
    lines.push(`${pad}    }`, `${pad}}`)
    effects.forEach((effect, index) => {
      if (effect.on !== 'change') return
      const [value, before] = effect.params
      lines.push(
        `${pad}.onChange(of: ${emit.expr(effect.source)}) { (${before.unused ? '_' : before.name}: ${swiftType(before.type)}, ${value.unused ? '_' : value.name}: ${swiftType(value.type)}) in`,
        `${pad}    let context = self.mavisContext`,
        call(effect, index, 4, [
          value.unused ? `${emit.expr(effect.source)}` : value.name,
          before.unused ? `${emit.expr(effect.source)}` : before.name,
        ]),
        `${pad}}`,
      )
    })
    return lines
  }
  const run = (effect, by) => {
    const body = emit.statements(effect.body, indent + by + (effect.async ? 4 : 0))
    return effect.async
      ? [`${pad}${' '.repeat(by)}_Concurrency.Task { @MainActor in`, body, `${pad}${' '.repeat(by)}}`]
      : [body]
  }
  const mounted = (component.effects ?? []).filter((effect) => effect.on === 'mount')
  if (mounted.length)
    // A view can appear more than once; a component is mounted once.
    lines.push(
      `${pad}.onAppear {`,
      `${pad}    guard !self.mavisMounted else { return }`,
      `${pad}    self.mavisMounted = true`,
      ...mounted.flatMap((effect) => run(effect, 4)),
      `${pad}}`,
    )
  for (const effect of component.effects ?? []) {
    if (effect.on === 'unmount') lines.push(`${pad}.onDisappear {`, ...run(effect, 4), `${pad}}`)
    if (effect.on === 'change') {
      const [value, before] = effect.params
      lines.push(
        `${pad}.onChange(of: ${emit.expr(effect.source)}) { (${before.unused ? '_' : before.name}: ${swiftType(before.type)}, ${value.unused ? '_' : value.name}: ${swiftType(value.type)}) in`,
        ...run(effect, 4),
        `${pad}}`,
      )
    }
  }
  return lines.filter(Boolean)
}

/** The hooks of a generated Vue script, and what they import from vue. */
export function vueEffects(component) {
  const names = { mount: 'onMounted', unmount: 'onUnmounted', change: 'watch' }
  const effects = component.effects ?? []
  return {
    imports: [...new Set(effects.map((effect) => names[effect.on]))],
    lines: effects.map((effect) => {
      const params = (effect.params ?? [])
        .map((param, index) => (param.unused ? `_${index}` : param.name))
        .join(', ')
      const body = `${effect.async ? 'async ' : ''}(${params}) => {\n${statements(effect.body, 2)}\n}`
      return effect.on === 'change'
        ? `watch(() => ${js(effect.source)}, ${body})`
        : `${names[effect.on]}(${body})`
    }),
  }
}
