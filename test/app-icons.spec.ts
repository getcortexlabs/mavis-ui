import { describe, expect, it, vi } from 'vitest'
import { AppIconError, createAppIconController } from '../packages/core/src/app-icons.js'

const choices = [
  { id: 'primary', label: 'Mavis' },
  { id: 'night', label: 'Midnight' },
]
describe('launcher icon ownership', () => {
  it('serializes OS changes, reads the OS selection and resets without storing another preference', async () => {
    let current = 'primary'
    let complete!: () => void
    const select = vi.fn(
      (id: string) =>
        new Promise<void>((resolve) => {
          complete = () => {
            current = id
            resolve()
          }
        }),
    )
    const icons = createAppIconController(choices, 'primary', {
      supported: () => true,
      current: () => current,
      select,
    })
    const first = icons.select('night'),
      second = icons.reset()
    await Promise.resolve()
    expect(select).toHaveBeenCalledOnce()
    expect(icons.current()).toBe('primary')
    complete()
    await first
    await Promise.resolve()
    expect(select).toHaveBeenLastCalledWith('primary')
    complete()
    await second
    expect(icons.current()).toBe('primary')
    await icons.reset()
    expect(select).toHaveBeenCalledTimes(2)
  })
  it('rejects unknown/unsupported choices and allows a retry after a platform failure', async () => {
    let supported = false
    const failure = new AppIconError('platform', 'OS declined')
    const select = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined)
    const icons = createAppIconController(choices, 'primary', {
      supported: () => supported,
      current: () => 'primary',
      select,
    })
    await expect(icons.select('unknown')).rejects.toMatchObject({ code: 'unknown-icon' })
    await expect(icons.select('night')).rejects.toMatchObject({ code: 'unsupported' })
    supported = true
    await expect(icons.select('night')).rejects.toBe(failure)
    await expect(icons.select('night')).resolves.toBeUndefined()
    expect(select).toHaveBeenCalledTimes(2)
  })
  it('rejects ambiguous configuration and keeps choices immutable', () => {
    const adapter = { supported: () => false, current: () => undefined, select: async () => {} }
    expect(() => createAppIconController([...choices, choices[0]!], 'primary', adapter)).toThrow(
      AppIconError,
    )
    expect(() => createAppIconController(choices, 'missing', adapter)).toThrow(AppIconError)
    const icons = createAppIconController(choices, 'primary', adapter)
    expect(Object.isFrozen(icons.choices[0])).toBe(true)
    expect(Object.isFrozen(choices[0])).toBe(false)
  })
})
