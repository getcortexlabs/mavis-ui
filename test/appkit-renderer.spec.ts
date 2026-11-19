import { describe, expect, it } from 'vitest'
import { defineComponent, Fragment, h, nextTick, onUnmounted, ref } from 'vue'
import { appkitRenderer, type NativeHost, type NativeNode } from '../examples/appkit/src/renderer'

function harness() {
  const released: NativeNode[] = []
  const host: NativeHost = {
    create(kind) {
      const node: NativeNode = { kind, text: '', props: {}, children: [], parent: null }
      node.dispose = () => released.push(node)
      return node
    },
    update() {},
    attach() {},
    detach() {},
    layout() {},
  }
  return { root: host.create('root'), renderer: appkitRenderer(host), released }
}

describe('experimental AppKit Vue renderer', () => {
  it('moves keyed nodes without recreating their native identity or disposing owners', async () => {
    const { root, renderer, released } = harness()
    const order = ref(['a', 'b', 'c'])
    const app = renderer.createApp({
      render: () =>
        h(
          'column',
          order.value.map((id) => h('input', { key: id, id })),
        ),
    })
    app.mount(root)
    const original = [...root.children[0]!.children]
    order.value = ['c', 'a', 'b']
    await nextTick()
    expect(root.children[0]!.children).toEqual([original[2], original[0], original[1]])
    expect(released).toEqual([])
    app.unmount()
    expect(original.every((node) => released.includes(node))).toBe(true)
  })

  it('updates computed content and native model listeners through ordinary Vue reactivity', async () => {
    const { root, renderer } = harness()
    const query = ref('')
    renderer
      .createApp({
        render: () =>
          h('column', [
            h('input', {
              modelValue: query.value,
              'onUpdate:modelValue': (value: string) => {
                query.value = value
              },
            }),
            h('text', query.value.toUpperCase()),
          ]),
      })
      .mount(root)
    const [input, label] = root.children[0]!.children
    input!.props['onUpdate:modelValue']('Porto')
    await nextTick()
    expect(input!.props.modelValue).toBe('Porto')
    expect(label!.text).toBe('PORTO')
  })

  it('removes fragments and nested owners exactly once when navigation replaces a screen', async () => {
    const { root, renderer, released } = harness()
    const visible = ref(true)
    let unmounted = 0
    const Screen = defineComponent({
      setup() {
        onUnmounted(() => {
          unmounted++
        })
        return () =>
          h(Fragment, [h('column', [h('input'), h('reveal', [h('text', 'Saved')])]), h('button')])
      },
    })
    const app = renderer.createApp({
      render: () => (visible.value ? h(Screen) : h('text', 'Next screen')),
    })
    app.mount(root)
    visible.value = false
    await nextTick()
    expect(unmounted).toBe(1)
    expect(root.children).toHaveLength(1)
    expect(root.children[0]!.text).toBe('Next screen')
    expect(released.length).toBe(new Set(released).size)
    expect(released.filter((node) => node.kind === 'input')).toHaveLength(1)
    expect(released.every((node) => node.parent === null)).toBe(true)
    app.unmount()
    expect(root.children).toEqual([])
  })

  it('replaces child views with element text and releases the previous subtree', () => {
    const { root, renderer, released } = harness()
    renderer.render(h('column', [h('input')]), root)
    const input = root.children[0]!.children[0]
    renderer.render(h('column', 'Empty'), root)
    expect(released).toContain(input)
    expect(root.children[0]!.children).toEqual([])
    expect(root.children[0]!.text).toBe('Empty')
  })
})
