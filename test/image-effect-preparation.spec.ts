import { expect, it, vi } from 'vitest'
import { registerMotionImage, webImageEffect } from '../packages/web/src/image-effects.js'
import type { WebRuntime } from '@rafaelaugusto/jolt/web'

it('does not let an older destination decode replace a newer image operation', async () => {
  const decoded: (() => void)[] = []
  class Destination {
    src = ''
    decode() {
      return new Promise<void>((resolve) => decoded.push(resolve))
    }
  }
  const image = {
    complete: true,
    naturalWidth: 100,
    isConnected: true,
    src: 'original',
    ownerDocument: { defaultView: { Image: Destination } },
  } as unknown as HTMLImageElement
  const release = registerMotionImage(image, { current: () => true, commit: async () => true })
  const run = vi.fn(() => ({ finished: new Promise<boolean>(() => {}), stop() {}, progress: 0 }))
  const owner = { imageEffect: run } as unknown as WebRuntime
  const old = webImageEffect(owner, image, 'dissolve', { to: 'old.png' })
  const latest = webImageEffect(owner, image, 'dissolve', { to: 'latest.png' })
  decoded[1]!()
  await latest
  decoded[0]!()
  await expect(old).rejects.toThrow(/changed/)
  expect(run).toHaveBeenCalledOnce()
  release()
})

it('rejects dissolve source replacement when srcset owns image selection', async () => {
  const image = {
    complete: true,
    naturalWidth: 100,
    srcset: 'small.png 320w',
    isConnected: true,
  } as HTMLImageElement
  const commit = vi.fn(async () => true)
  const release = registerMotionImage(image, { current: () => true, commit })
  const run = vi.fn()
  await expect(
    webImageEffect({ imageEffect: run } as unknown as WebRuntime, image, 'dissolve', {
      to: 'next.png',
    }),
  ).rejects.toThrow(/srcset/)
  expect(run).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  release()
})
