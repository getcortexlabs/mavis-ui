import { useStore, onMount } from '@builder.io/mitosis'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
export default function Home() {
  const motion = createMotionSurface()
  const state = useStore({
    picture: '~/assets/gallery-blue.png',
    status: 'Loading',
    setups: 0,
    cleanups: 0,
    async move() {
      try {
        const playback = motion.animate(
          { x: 16, opacity: [0.5, 1] },
          { type: 'tween', duration: 120 },
        )
        const finished = await playback.finished
        state.status = finished ? 'Moved' : 'Interrupted'
      } catch {
        state.status = 'Unavailable'
      }
    },
  })
  onMount(() => {
    motion.onAvailable(() => {
      state.setups += 1
      state.status = 'Ready'
      return () => {
        state.cleanups += 1
        state.status = 'Unavailable'
      }
    })
  })
  return (
    <MColumn gap="sm" width={240}>
      <MImage src={state.picture} alt="Motion artwork" motionSurface={motion} />
      <MButton text="Move" onClick={() => state.move()} />
      <MButton
        text="Next picture"
        onClick={() => {
          state.picture = '~/assets/gallery-green.png'
        }}
      />
      <MButton
        text="Break picture"
        onClick={() => {
          state.picture = 'data:image/png;base64,broken'
        }}
      />
      <MButton
        text="Restore picture"
        onClick={() => {
          state.picture = '~/assets/gallery-blue.png'
        }}
      />
      <MText>{state.status}</MText>
      <MText>{`Setups ${state.setups}`}</MText>
      <MText>{`Cleanups ${state.cleanups}`}</MText>
    </MColumn>
  )
}
