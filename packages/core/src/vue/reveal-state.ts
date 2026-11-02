import { onBeforeUnmount, ref, watch } from '@vue/runtime-core'

export interface RevealHost {
  animate(open: boolean, fromClosed: boolean): { finished: Promise<boolean>; stop(): void }
  interactive(enabled: boolean): void
  captureFocus(): void
  restoreFocus(): void
  release(): void
}

/** Presence outlives a closing animation. Reversal updates the same mounted subtree. */
export function useRevealState(show: () => boolean) {
  const present = ref(show())
  const phase = ref<'open' | 'opening' | 'closing' | 'closed'>(show() ? 'open' : 'closed')
  let host: RevealHost | undefined
  let playback: ReturnType<RevealHost['animate']> | undefined
  let revision = 0
  let fresh = false
  const settle = (open: boolean) => {
    phase.value = open ? 'open' : 'closed'
    present.value = open
  }
  function run(open: boolean) {
    if (!host) return
    const current = ++revision
    if (open) host.captureFocus()
    else host.restoreFocus()
    host.interactive(open)
    // Starting a new Jolt operation hands the current trajectory to its successor.
    playback = host.animate(open, fresh)
    fresh = false
    return playback.finished.then(
      () => {
        if (current === revision) {
          playback = undefined
          settle(open)
        }
      },
      (error) => {
        if (current === revision) {
          playback = undefined
          settle(open)
        }
        throw error
      },
    )
  }
  watch(
    show,
    (open) => {
      const wasPresent = present.value
      fresh = open && !wasPresent
      if (open) present.value = true
      phase.value = open ? 'opening' : 'closing'
      if (host) return run(open)
      else if (!open) settle(false)
    },
    { flush: 'pre' },
  )
  const detach = () => {
    revision++
    playback?.stop()
    playback = undefined
    host?.release()
    host = undefined
    settle(show())
  }
  onBeforeUnmount(detach)
  return {
    present,
    phase,
    detach,
    attach(next: RevealHost) {
      revision++
      playback?.stop()
      playback = undefined
      host?.release()
      host = next
      if (phase.value === 'opening' || phase.value === 'closing') return run(show())
      else host.interactive(show())
    },
  }
}
