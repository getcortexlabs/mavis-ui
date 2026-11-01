import type { AriaAttributes, HTMLAttributes } from 'vue'

type EditorEvents = Pick<
  HTMLAttributes,
  | 'onBeforeinput'
  | 'onInput'
  | 'onChange'
  | 'onInvalid'
  | 'onKeydown'
  | 'onKeyup'
  | 'onKeypress'
  | 'onCompositionstart'
  | 'onCompositionupdate'
  | 'onCompositionend'
>

export interface InputEditorAttributes extends AriaAttributes, EditorEvents {}

declare module '@getcortexlabs/mavis-core/vue' {
  interface InputPlatformAttributes extends InputEditorAttributes {}
}

/** Editing events belong to the editor; layout and other attributes stay on its wrapper. */
const editorEvent =
  /^on(?:Beforeinput|Input|Change|Invalid|Keydown|Keyup|Keypress|Compositionstart|Compositionupdate|Compositionend)(?:Once|Capture|Passive)*$/

export function inputAttrs(attrs: Record<string, unknown>) {
  const editor: Record<string, unknown> = {}
  const wrapper: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(attrs)) {
    const target = name.startsWith('aria-') || editorEvent.test(name) ? editor : wrapper
    target[name] = value
  }
  return { editor, wrapper }
}

export function describedBy(value: unknown, message: string | undefined) {
  const ids = typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean) : []
  if (message) ids.push(message)
  return [...new Set(ids)].join(' ') || undefined
}
