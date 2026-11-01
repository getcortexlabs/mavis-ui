import { describe, expect, it } from 'vitest'
import { choiceKey, validateChoices, canChoose } from '../packages/core/src/choice.js'

describe('shared choice contract', () => {
  it('keeps labels independent of typed values, including zero and empty string', () => {
    const options = [
      { value: 1, label: 'One' },
      { value: '1', label: 'Um' },
      { value: 0, label: 'Zero' },
      { value: '', label: 'Empty key' },
    ]
    expect(() => validateChoices(options, null)).not.toThrow()
    expect(choiceKey(1)).not.toBe(choiceKey('1'))
    expect(() => validateChoices(options, 'removed')).not.toThrow()
  })
  it('rejects duplicate keys, missing labels and invalid model values', () => {
    expect(() =>
      validateChoices(
        [
          { value: 'a', label: 'A' },
          { value: 'a', label: 'B' },
        ],
        null,
      ),
    ).toThrow(RangeError)
    expect(() => validateChoices([{ value: 'a', label: '  ' }], null)).toThrow(TypeError)
    expect(() => validateChoices([{ value: Infinity, label: 'A' }], null)).toThrow(TypeError)
    expect(() => validateChoices([], NaN)).toThrow(TypeError)
  })
  it('suppresses disabled and repeated choices without replacing the selection', () => {
    const option = { value: 0, label: 'Zero' }
    expect(canChoose(option, null)).toBe(true)
    expect(canChoose(option, 0)).toBe(false)
    expect(canChoose(option, null, true)).toBe(false)
    expect(canChoose({ ...option, disabled: true }, null)).toBe(false)
  })
})
