import { effectScope, nextTick, reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { checkDialogLabels } from '../packages/core/src/dialog.js'
import { useDialogState } from '../packages/core/src/vue/dialog.js'

function fixture() {
  const props = reactive({ open: true, loading: false, dismissible: true })
  const emit = vi.fn()
  const scope = effectScope()
  const state = scope.run(() => useDialogState(props, emit))!
  return { props, emit, state, dispose: () => scope.stop() }
}
describe('Dialog decisions', () => {
  it('rejects empty labels instead of rendering unnamed actions', () => {
    for (let i = 0; i < 4; i++) {
      const values = ['Title', 'Continue', 'Cancel', 'Working']
      values[i] = '  '
      expect(() => checkDialogLabels(...(values as [string, string, string, string]))).toThrow(
        'non-empty',
      )
    }
  })
  it('keeps confirmation controlled, suppresses duplicate taps and allows retry after failure', async () => {
    const f = fixture()
    f.state.confirm()
    f.state.confirm()
    expect(f.emit.mock.calls).toEqual([['confirm']])
    expect(f.state.visible.value).toBe(true)
    f.props.loading = true
    await nextTick()
    f.state.confirm()
    f.state.request('cancel')
    f.state.request('back')
    expect(f.emit).toHaveBeenCalledTimes(1)
    f.props.loading = false
    f.state.confirm()
    expect(f.emit.mock.calls).toEqual([['confirm'], ['confirm']])
    f.dispose()
  })
  it('emits one close reason when the parent accepts and stays usable when it rejects', async () => {
    const f = fixture()
    f.state.request('cancel')
    f.state.request('cancel')
    expect(f.emit.mock.calls).toEqual([
      ['update:open', false],
      ['close', 'cancel'],
    ])
    await nextTick()
    expect(f.state.visible.value).toBe(true)
    f.state.request('backdrop')
    f.props.open = false
    await nextTick()
    expect(f.emit.mock.calls.slice(2)).toEqual([
      ['update:open', false],
      ['close', 'backdrop'],
    ])
    expect(f.state.presented.value).toBe(true)
    f.state.left()
    expect(f.state.presented.value).toBe(false)
    f.dispose()
  })
  it('allows explicit cancel with incidental dismissal disabled and programmatic close while busy', async () => {
    const f = fixture()
    f.props.dismissible = false
    for (const reason of ['backdrop', 'back', 'escape'] as const) f.state.request(reason)
    expect(f.emit).not.toHaveBeenCalled()
    f.state.request('cancel')
    expect(f.emit).toHaveBeenLastCalledWith('close', 'cancel')
    await nextTick()
    f.props.loading = true
    f.props.open = false
    await nextTick()
    expect(f.emit).toHaveBeenLastCalledWith('close', 'program')
    f.props.open = true
    await nextTick()
    f.state.left()
    expect(f.state.presented.value).toBe(true)
    f.dispose()
  })
  it('releases a retained native page during navigation even while loading', () => {
    const f = fixture()
    f.props.loading = true
    f.props.dismissible = false
    f.state.request('navigation')
    expect(f.emit.mock.calls).toEqual([
      ['update:open', false],
      ['close', 'navigation'],
    ])
    expect(f.state.presented.value).toBe(false)
    f.dispose()
  })
})
