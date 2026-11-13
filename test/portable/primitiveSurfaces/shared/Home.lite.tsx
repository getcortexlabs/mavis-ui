import { useStore } from '@builder.io/mitosis'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
export default function Home() {
  const button = createMotionSurface()
  const card = createMotionSurface()
  const text = createMotionSurface()
  const state = useStore({
    status: 'Ready',
    clicks: 0,
    async move() {
      try {
        button.set({ x: 12 })
        card.set({ x: 16 })
        const playback = text.animate(
          { x: [null, 20], opacity: [0.5, 1] },
          { type: 'tween', duration: 100 },
        )
        const finished = await playback.finished
        state.status = finished ? 'Moved' : 'Interrupted'
      } catch {
        state.status = 'Unavailable'
      }
    },
    reset() {
      try {
        button.set({ x: 0 })
        card.set({ x: 0 })
        text.set({ x: 0, opacity: 1 })
        state.status = 'Reset'
      } catch {
        state.status = 'Unavailable'
      }
    },
  })
  return (
    <MColumn gap="sm" width={360}>
      <MText id="surface-text" motionSurface={text}>
        Motion primitives
      </MText>
      <MButton
        id="surface-button"
        text="Surface button"
        motionSurface={button}
        onClick={() => state.clicks++}
      />
      <MCard
        id="surface-card"
        label="Surface card"
        motionSurface={card}
        onClick={() => state.clicks++}
      >
        <MText>Card content</MText>
      </MCard>
      <MButton text="Move" onClick={() => state.move()} />
      <MButton text="Reset" onClick={() => state.reset()} />
      <MText>{state.status + ' / Clicks ' + state.clicks}</MText>
    </MColumn>
  )
}
