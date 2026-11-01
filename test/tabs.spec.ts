import { describe, expect, it } from 'vitest'
import { tabFocusTarget, tabScrollOffset, validateTabs } from '../packages/core/src/tabs.js'

const tabs = [
  { value: 0, label: 'Number' },
  { value: '0', label: 'String' },
  { value: 'disabled', label: 'Unavailable', disabled: true },
  { value: 'last', label: 'Last' },
]
describe('Tabs navigation', () => {
  it('requires a group name and unambiguous values without selecting a fallback', () => {
    expect(() => validateTabs(tabs, null, 'Sections')).not.toThrow()
    expect(() => validateTabs(tabs, 'removed', 'Sections')).not.toThrow()
    expect(() => validateTabs([], 0, 'Sections')).not.toThrow()
    expect(() => validateTabs(tabs, 0, ' ')).toThrow('label')
    expect(() => validateTabs([...tabs, { value: 0, label: 'Duplicate' }], 0, 'Sections')).toThrow(
      'Duplicate',
    )
  })
  it('wraps focus, skips disabled tabs and treats number/string values separately', () => {
    expect(tabFocusTarget(tabs, 0, 'ArrowRight')?.value).toBe('0')
    expect(tabFocusTarget(tabs, '0', 'ArrowRight')?.value).toBe('last')
    expect(tabFocusTarget(tabs, 'last', 'ArrowRight')?.value).toBe(0)
    expect(tabFocusTarget(tabs, 0, 'ArrowLeft')?.value).toBe('last')
    expect(tabFocusTarget(tabs, '0', 'Home')?.value).toBe(0)
    expect(tabFocusTarget(tabs, '0', 'End')?.value).toBe('last')
    expect(tabFocusTarget(tabs, 0, 'ArrowLeft', true)?.value).toBe('0')
    expect(tabFocusTarget(tabs, 0, 'Enter')).toBeUndefined()
    expect(
      tabFocusTarget(
        tabs.map((tab) => ({ ...tab, disabled: true })),
        0,
        'ArrowRight',
      ),
    ).toBeUndefined()
  })
  it('reveals only the hidden edge, including a tab wider than its viewport', () => {
    expect(tabScrollOffset(100, 60, 80, 200)).toBe(80)
    expect(tabScrollOffset(20, 60, 80, 200)).toBe(20)
    expect(tabScrollOffset(300, 60, 80, 200)).toBe(160)
    expect(tabScrollOffset(20, 400, 80, 200)).toBe(20)
  })
})
