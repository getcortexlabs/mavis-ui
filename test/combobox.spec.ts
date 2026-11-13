import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, reactive } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createComboboxSearch,
  comboboxMove,
  comboboxSelected,
  type ComboboxSearchContext,
} from '../packages/core/src/combobox.js'
import { useCombobox, comboboxProps, comboboxEmits } from '../packages/core/src/vue/combobox.js'
import { MCombobox } from '../packages/web/src/components/MCombobox.js'
import type { ChoiceOption } from '../packages/core/src/choice.js'
import { renderer, node } from './renderer.js'

const options: ChoiceOption[] = [
  { value: 1, label: 'Number' },
  { value: '1', label: 'String' },
  { value: 'off', label: 'Unavailable', disabled: true },
]
const flush = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
}
afterEach(() => vi.useRealTimers())

describe('combobox request boundary', () => {
  it('hydrates a bounded snapshot without invoking the host and reuses the current query', () => {
    const search = vi.fn(async (_query: string) => options)
    const controller = createComboboxSearch({
      search,
      initialResults: { query: 'one', options },
      maxResults: 2,
    })
    expect(search).not.toHaveBeenCalled()
    controller.request('one')
    expect(search).not.toHaveBeenCalled()
    expect(controller.state.options.map((item) => item.value)).toEqual([1, '1'])
    expect(controller.state.limited).toBe(true)
    controller.dispose()
  })
  it('debounces, cancels the host and ignores stale success and failure even for repeated queries', async () => {
    vi.useFakeTimers()
    const pending: {
      query: string
      context: ComboboxSearchContext
      resolve: (value: ChoiceOption[]) => void
      reject: (reason: Error) => void
    }[] = []
    const abort = vi.fn()
    const controller = createComboboxSearch({
      debounce: 10,
      search: (query, context) =>
        new Promise((resolve, reject) => {
          context.onCancel(abort)
          pending.push({ query, context, resolve, reject })
        }),
    })
    controller.request('a')
    controller.request('ab')
    await vi.advanceTimersByTimeAsync(10)
    expect(pending.map((item) => item.query)).toEqual(['ab'])
    controller.request('a')
    await vi.advanceTimersByTimeAsync(10)
    expect(abort).toHaveBeenCalledOnce()
    pending[1]!.resolve(options)
    await flush()
    pending[0]!.reject(new Error('late failure'))
    await flush()
    expect(controller.state.status).toBe('success')
    expect(controller.state.query).toBe('a')
    controller.request('ab')
    await vi.advanceTimersByTimeAsync(10)
    controller.cancel()
    pending[2]!.resolve([{ value: 'stale', label: 'Old' }])
    await flush()
    expect(controller.state.status).toBe('idle')
    expect(controller.state.options).toEqual([])
    expect(new Set(pending.map((item) => item.context.requestId)).size).toBe(3)
    controller.dispose()
  })
  it('covers minimum length, empty, failure, retry, validation and cleanup after disposal', async () => {
    vi.useFakeTimers()
    const search = vi
      .fn()
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(options)
    const changed = vi.fn()
    const controller = createComboboxSearch({
      search,
      debounce: 5,
      minQueryLength: 2,
      onChange: changed,
    })
    controller.request(' a ')
    expect(controller.state.status).toBe('idle')
    controller.request('ab')
    await vi.advanceTimersByTimeAsync(5)
    expect(controller.state.status).toBe('error')
    controller.retry()
    await flush()
    expect(controller.state.status).toBe('empty')
    controller.retry()
    await flush()
    expect(controller.state.status).toBe('success')
    controller.request('next')
    controller.dispose()
    const calls = changed.mock.calls.length
    await vi.advanceTimersByTimeAsync(100)
    controller.request('ignored')
    expect(changed).toHaveBeenCalledTimes(calls)
    expect(search).toHaveBeenCalledTimes(3)
    expect(() => createComboboxSearch({ search, maxResults: 101 })).toThrow(RangeError)
    expect(() => createComboboxSearch({ search, debounce: -1 })).toThrow(RangeError)
    expect(() =>
      createComboboxSearch({
        search,
        initialResults: { query: '', options: [options[0]!, options[0]!] },
      }),
    ).toThrow(RangeError)
  })
  it('retains typed selection outside the page and skips disabled highlights', () => {
    expect(comboboxMove(options, undefined, 1)).toBe('n:1')
    expect(comboboxMove(options, 'n:1', 1)).toBe('s:1')
    expect(comboboxMove(options, 's:1', 1)).toBe('s:1')
    expect(comboboxSelected(1, [], options[0])).toEqual(options[0])
    expect(comboboxSelected('1', [], options[0])).toBeUndefined()
    expect(comboboxSelected(null, options, options[0])).toBeUndefined()
  })
})

describe('combobox controlled interaction', () => {
  function mount(accept: boolean, seedSelection = true) {
    const search = vi.fn(async (_query: string) => options)
    const host = reactive({
      query: 'one',
      modelValue: 1 as string | number | null,
      disabled: false,
    })
    const events: [string, unknown][] = []
    let combo!: ReturnType<typeof useCombobox>
    const Harness = defineComponent({
      props: comboboxProps,
      emits: comboboxEmits,
      setup(props, { emit }) {
        combo = useCombobox(props, emit)
        return () => h('input', { value: props.query })
      },
    })
    const app = renderer.createApp({
      render: () =>
        h(Harness, {
          ...host,
          label: 'Choice',
          search,
          debounce: 0,
          initialResults: { query: 'one', options },
          selectedOption: seedSelection ? options[0] : null,
          'onUpdate:query': (value: string) => {
            events.push(['query', value])
            if (accept) host.query = value
          },
          'onUpdate:modelValue': (value: string | number | null) => {
            events.push(['value', value])
            if (accept) host.modelValue = value
          },
        }),
    })
    app.mount(node('root'))
    return { app, combo, search, host, events }
  }
  it('does not search rejected queries or commit merely by typing/highlighting', async () => {
    const test = mount(false)
    test.combo.show()
    test.combo.edit('rejected')
    await flush()
    expect(test.search).not.toHaveBeenCalled()
    expect(test.host.query).toBe('one')
    test.combo.move(1)
    expect(test.events.filter(([event]) => event === 'value')).toEqual([])
    test.combo.move(1)
    test.combo.commit()
    await flush()
    expect(test.host.modelValue).toBe(1)
    expect(test.combo.selected.value?.label).toBe('Number')
    expect(test.events).toContainEqual(['value', '1'])
    test.app.unmount()
  })
  it('keeps the previous label when a rejected selection is outside the current page', async () => {
    const test = mount(false, false)
    test.search.mockResolvedValueOnce([options[1]!])
    test.host.query = 'replacement'
    await flush()
    test.combo.show()
    await flush()
    expect(test.combo.state.value.options).toEqual([options[1]])
    test.combo.choose(options[1]!)
    await flush()
    expect(test.host.modelValue).toBe(1)
    expect(test.combo.selected.value?.label).toBe('Number')
    test.app.unmount()
  })
  it('waits for composition, cancels without selection and closes on disable', async () => {
    const test = mount(true)
    test.combo.show()
    test.combo.startComposition()
    test.combo.edit('日本')
    await flush()
    expect(test.search).not.toHaveBeenCalled()
    test.combo.endComposition('日本')
    test.combo.edit('日本')
    await flush()
    expect(test.search).toHaveBeenCalledOnce()
    expect(test.search.mock.calls[0]?.[0]).toBe('日本')
    test.combo.cancel()
    await flush()
    expect(test.host.query).toBe('Number')
    expect(test.host.modelValue).toBe(1)
    test.combo.show()
    test.host.disabled = true
    await flush()
    expect(test.combo.open.value).toBe(false)
    test.app.unmount()
  })
  it('starts one request when a controlled query and an inline search callback change together', async () => {
    const host = reactive({ query: '' })
    let combo!: ReturnType<typeof useCombobox>
    const search = vi.fn(async (_query: string): Promise<readonly ChoiceOption[]> => {
      throw new Error('Offline')
    })
    const Harness = defineComponent({
      props: comboboxProps,
      emits: comboboxEmits,
      setup(props, { emit }) {
        combo = useCombobox(props, emit)
        return () => h('input')
      },
    })
    const app = renderer.createApp({
      render: () =>
        h(Harness, {
          label: 'City',
          query: host.query,
          debounce: 0,
          search: (query: string) => search(query),
          'onUpdate:query': (query: string) => {
            host.query = query
          },
        }),
    })
    app.mount(node('root'))
    combo.edit('fail')
    await flush()
    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenLastCalledWith('fail')
    expect(combo.state.value.status).toBe('error')
    search.mockResolvedValueOnce(options)
    combo.retry()
    await flush()
    expect(search).toHaveBeenCalledTimes(2)
    expect(combo.state.value.status).toBe('success')
    app.unmount()
  })
  it('SSR keeps initial selection/query and services outside the HTML without searching', async () => {
    const search = vi.fn(async (_query: string) => options)
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MCombobox, {
            label: 'Organization',
            query: 'Num',
            modelValue: 1,
            selectedOption: options[0],
            initialResults: { query: 'Num', options },
            search,
          }),
      }),
    )
    expect(search).not.toHaveBeenCalled()
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('value="Num"')
    expect(html).toContain('Number')
    expect(html).not.toContain('requestId')
  })
})
