import { useStore } from '@builder.io/mitosis'
import { createMotionSurface, createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
export default function Home() {
  const first = createMotionSurface()
  const second = createMotionSurface()
  const region = createMotionRegion()
  const state = useStore({
    status: 'Ready',
    async play() {
      try {
        const timeline = region.timeline([
          [first, { x: [0, 24] }, { type: 'tween', duration: 100 }],
          [second, { opacity: [0.3, 1] }, { at: '<', type: 'tween', duration: 100 }],
          [first, { x: 0 }, { at: '+20', type: 'tween', duration: 100 }],
        ])
        timeline.pause()
        timeline.resume()
        const finished = await timeline.finished
        state.status = finished ? 'Together' : 'Interrupted'
      } catch {
        state.status = 'Unavailable'
      }
    },
  })
  return (
    <MColumn gap="sm">
      <MBox motionRegion={region}>
        <MColumn>
          <MBox motionSurface={first} height={40}>
            <MText>First</MText>
          </MBox>
          <MBox motionSurface={second} height={40}>
            <MText>Second</MText>
          </MBox>
        </MColumn>
      </MBox>
      <MButton text="Play together" onClick={() => state.play()} />
      <MText>{state.status}</MText>
    </MColumn>
  )
}
