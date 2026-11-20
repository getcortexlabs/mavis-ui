/** The deliberately bounded contract shared by adoption diagnostics and both native hosts. */
export const desktopComponents = Object.freeze({
  MScreen: { tag: 'screen', props: ['scroll'] },
  MColumn: { tag: 'column', props: ['padding', 'gap'] },
  MRow: { tag: 'row', props: ['padding', 'gap'] },
  MGrid: { tag: 'grid', props: ['minColumnWidth', 'gap'] },
  MText: { tag: 'text', props: ['text', 'as', 'variant', 'tone'] },
  MInput: {
    tag: 'input',
    props: [
      'modelValue',
      'label',
      'placeholder',
      'readonly',
      'disabled',
      'onUpdate:modelValue',
      'onSubmit',
      'onEscape',
    ],
  },
  MReveal: { tag: 'reveal', props: ['show'] },
  MButton: {
    tag: 'button',
    props: ['href', 'text', 'loading', 'loadingText', 'disabled', 'onClick'],
    macos: ['shortcut'],
  },
  MLink: { tag: 'link', props: ['href', 'text', 'disabled', 'onClick'] },
  MCard: { tag: 'card', props: ['href', 'padding', 'gap', 'onClick', 'disabled'] },
  MAlert: { tag: null, props: ['title', 'description', 'tone'] },
  MEmptyState: { tag: null, props: ['title', 'description'] },
})
export function nativeProps(kind, target) {
  const component = Object.values(desktopComponents).find((component) => component.tag === kind)
  return ['id', 'accessibilityLabel', ...(component?.props ?? []), ...(component?.[target] ?? [])]
}
