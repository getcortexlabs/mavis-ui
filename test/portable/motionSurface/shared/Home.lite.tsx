import { useStore } from '@builder.io/mitosis'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
export default function Home() {
  const motion = createMotionSurface()
  const state = useStore({
    status: 'Ready',
    async move() {
      try {
        const playback = motion.animate(
          { x: [null, 24], opacity: [0.5, 1] },
          { type: 'tween', duration: 120 },
        )
        playback.pause()
        playback.resume()
        const finished = await playback.finished
        state.status = finished ? 'Moved' : 'Interrupted'
      } catch {
        state.status = 'Unavailable'
      }
    },
    reset() {
      try {
        motion.set({ x: 0, opacity: 1 })
        state.status = 'Reset'
      } catch {
        state.status = 'Unavailable'
      }
    },
  })
  return (
    <MColumn gap="sm">
      <MBox motionSurface={motion} height={50}>
        <MText>Motion</MText>
      </MBox>
      <MButton text="Move" onClick={() => state.move()} />
      <MButton text="Reset" onClick={() => state.reset()} />
      <MText>{state.status}</MText>
    </MColumn>
  )
}
