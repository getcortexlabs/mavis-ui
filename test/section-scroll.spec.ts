import { describe, expect, it, vi } from 'vitest'
import { sectionScrollRange, validateSectionScroll } from '../packages/core/src/section-scroll.js'
import {
  bindMotionRegion,
  bindMotionScrollSource,
  bindMotionSurface,
  createMotionRegion,
  createMotionScrollSource,
  createMotionSurface,
  type MotionRegionAdapter,
} from '../packages/core/src/experimental.js'

describe('section-relative scroll', () => {
  it('maps section/viewport edges, clips unreachable offsets and updates after resizing', () => {
    expect(sectionScrollRange(800, 400, 600, 2000, {})).toEqual({
      range: [200, 1200],
      settled: false,
    })
    expect(sectionScrollRange(800, 800, 600, 2000, {})).toEqual({
      range: [200, 1600],
      settled: false,
    })
    expect(sectionScrollRange(0, 400, 600, 300, {})).toEqual({ range: [0, 300], settled: false })
    expect(
      sectionScrollRange(800, 400, 600, 2000, { start: ['center', 'end'], end: ['end', 'center'] })
        .range,
    ).toEqual([400, 900])
    expect(sectionScrollRange(0, 400, 600, 0, {}).settled).toBe(true)
    expect(() => validateSectionScroll({ start: ['unknown', 'end'] as never })).toThrow()
    expect(() =>
      sectionScrollRange(800, 400, 600, 2000, { start: ['end', 'start'], end: ['start', 'end'] }),
    ).toThrow()
  })
  it.each(['section', 'source', 'surface'])(
    'releases a section link when its %s disappears',
    (removed) => {
      const surface = createMotionSurface(),
        section = createMotionRegion(),
        source = createMotionScrollSource()
      const dispose = vi.fn()
      const releaseSection = bindMotionRegion(section, { kind: 'web' } as MotionRegionAdapter)
      const releaseSource = bindMotionScrollSource(source, { kind: 'web' })
      const scrollSection = vi.fn(() => ({
        execution: 'scheduler' as const,
        refresh() {},
        dispose,
      }))
      const releaseSurface = bindMotionSurface(surface, {
        animate: () => ({ finished: Promise.resolve(true), stop() {} }),
        set: () => ({ finished: Promise.resolve(true), stop() {} }),
        scrollSection,
      })
      const link = surface.scrollSection(source, section, { y: [0, 20] })
      expect(scrollSection).toHaveBeenCalledOnce()
      ;({ section: releaseSection, source: releaseSource, surface: releaseSurface })[
        removed as 'section'
      ]()
      expect(link.disposed).toBe(true)
      expect(dispose).toHaveBeenCalledOnce()
      releaseSection()
      releaseSource()
      releaseSurface()
      expect(dispose).toHaveBeenCalledOnce()
    },
  )
})
