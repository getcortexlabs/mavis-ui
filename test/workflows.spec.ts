import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createFormController } from '../packages/core/src/form.js'
import { pagination, validateSteps } from '../packages/core/src/navigation.js'
import {
  createMavis,
  MFormGroup,
  MFormErrors,
  MSteps,
  MPagination,
  useFormField,
} from '../packages/web/src/index.js'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
describe('form ownership', () => {
  it('focuses registered public handles in error order, skipping unavailable fields', async () => {
    const form = createFormController([
      { field: 'missing', message: 'Missing' },
      { field: 'disabled', message: 'Disabled' },
      { field: 'name', message: 'Required' },
    ])
    const focus = vi.fn()
    form.register({
      name: 'disabled',
      label: 'Disabled',
      target: () => ({ focus, blur() {} }),
      enabled: () => false,
    })
    const release = form.register({
      name: 'name',
      label: 'Name',
      target: () => ({ focus, blur() {} }),
    })
    expect(await form.focusFirstError()).toBe(true)
    expect(focus).toHaveBeenCalledTimes(1)
    release()
    release()
    expect(await form.focusFirstError()).toBe(false)
    expect(() => form.register({ name: 'disabled', label: 'Other', target: () => null })).toThrow(
      /Duplicate/,
    )
    form.dispose()
  })
  it('reveals a retained panel before focusing and cannot steal a later focus request', async () => {
    const form = createFormController([
      { field: 'a', message: 'A' },
      { field: 'b', message: 'B' },
    ])
    const revealed = deferred<void>()
    const first = vi.fn()
    const second = vi.fn()
    const release = form.register({
      name: 'a',
      label: 'A',
      reveal: () => revealed.promise,
      target: () => ({ focus: first, blur() {} }),
    })
    form.register({ name: 'b', label: 'B', target: () => ({ focus: second, blur() {} }) })
    const pending = form.focusFirstError()
    expect(await form.focusError('b')).toBe(true)
    release()
    revealed.resolve()
    expect(await pending).toBe(false)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    form.dispose()
  })
  it('drops a pending error focus when newer validation clears the error', async () => {
    const form = createFormController([{ field: 'name', message: 'Required' }])
    const shown = deferred<void>()
    const focus = vi.fn()
    form.register({
      name: 'name',
      label: 'Name',
      target: () => ({ focus, blur() {} }),
      reveal: () => shown.promise,
    })
    const pending = form.focusFirstError()
    expect(await form.validate(async () => [])).toBe('valid')
    shown.resolve()
    expect(await pending).toBe(false)
    expect(focus).not.toHaveBeenCalled()
    form.dispose()
  })
  it('rejects duplicate submission and ignores stale validation after editing or teardown', async () => {
    const form = createFormController()
    const request = deferred<readonly { field: string; message: string }[]>()
    const cancel = vi.fn()
    const pending = form.validate(async (context) => {
      context.onCancel(cancel)
      return request.promise
    })
    expect(form.state.validating).toBe(true)
    expect(await form.validate(async () => [])).toBe('busy')
    form.invalidate()
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(await form.validate(async () => [{ field: 'name', message: 'New error' }])).toBe(
      'invalid',
    )
    request.resolve([{ field: 'old', message: 'Obsolete' }])
    expect(await pending).toBe('cancelled')
    expect(form.state.errors).toEqual([{ field: 'name', message: 'New error' }])
    const next = deferred<never>()
    const unmounted = form.validate(() => next.promise)
    form.dispose()
    next.resolve(undefined as never)
    expect(await unmounted).toBe('cancelled')
    expect(form.disposed).toBe(true)
  })
  it('resets busy state on host failure and runs every cancellation even when one throws', async () => {
    const form = createFormController()
    await expect(
      form.validate(async () => {
        throw new Error('offline')
      }),
    ).rejects.toThrow('offline')
    expect(form.state.validating).toBe(false)
    const request = deferred<[]>()
    const release = vi.fn()
    const pending = form.validate(async (context) => {
      context.onCancel(() => {
        throw new Error('cancel')
      })
      context.onCancel(release)
      return request.promise
    })
    expect(() => form.dispose()).toThrow(AggregateError)
    expect(release).toHaveBeenCalledTimes(1)
    expect(form.state.validating).toBe(false)
    request.resolve([])
    expect(await pending).toBe('cancelled')
  })
})

describe('controlled navigation', () => {
  it('bounds pagination work even for very large collections and reports stale parent pages', () => {
    const huge = pagination(Number.MAX_SAFE_INTEGER, 1, 500)
    expect(huge.items.length).toBeLessThanOrEqual(9)
    expect(huge.next).toBe(501)
    expect(pagination(21, 10, 3).next).toBeNull()
    expect(pagination(5, 10, 3)).toMatchObject({
      count: 1,
      outOfRange: true,
      previous: 1,
      next: null,
    })
    expect(pagination(0, 10, 1)).toMatchObject({
      count: 0,
      items: [],
      previous: null,
      next: null,
      outOfRange: false,
    })
    for (const args of [
      [-1, 10, 1],
      [1, 0, 1],
      [1, 10, 0],
      [1, 10, 1, 3],
      [Infinity, 1, 1],
    ])
      expect(() => pagination(args[0]!, args[1]!, args[2]!, args[3])).toThrow(RangeError)
  })
  it('preserves typed step identities and rejects malformed navigation', () => {
    expect(() =>
      validateSteps(
        [
          { value: 1, label: 'One' },
          { value: '1', label: 'Another' },
        ],
        '1',
      ),
    ).not.toThrow()
    expect(() => validateSteps([], null)).toThrow()
    expect(() => validateSteps([{ value: 'a', label: 'A' }], 'missing')).toThrow()
    expect(() =>
      validateSteps([{ value: 'a', label: 'A', status: 'unknown' as 'error' }], 'a'),
    ).toThrow()
  })
  it('renders request-owned groups, errors and navigation without DOM or browser effects', async () => {
    const render = async (label: string) => {
      const form = createFormController([{ field: 'name', message: 'Required' }])
      const app = createSSRApp({
        setup() {
          useFormField(form, { name: 'name', label, target: () => null })
          return () =>
            h(MFormGroup, { label: 'Details', description: 'Your details' }, () => [
              h(MFormErrors, { form }),
              h(MSteps, {
                modelValue: 1,
                steps: [
                  { value: 1, label: 'Details' },
                  { value: 2, label: 'Review' },
                ],
                label: 'Registration',
              }),
              h(MPagination, { modelValue: 2, total: 25, pageSize: 10 }),
            ])
        },
      }).use(createMavis())
      const html = await renderToString(app)
      form.dispose()
      return html
    }
    const [a, b] = await Promise.all([render('First name'), render('Other name')])
    expect(a).toContain('First name: Required')
    expect(a).not.toContain('Other name')
    expect(b).toContain('Other name: Required')
    expect(a).toContain('aria-current="step"')
    expect(a).toContain('aria-current="page"')
    expect(a).toContain('aria-describedby=')
  })
})
