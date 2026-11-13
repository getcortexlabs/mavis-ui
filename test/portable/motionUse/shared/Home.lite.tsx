import { useStore, onMount, Show } from '@builder.io/mitosis'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
export default function Home() {
  const surface = createMotionSurface()
  const state = useStore({ visible: true, setups: 0, cleanups: 0, status: 'Waiting' })
  onMount(() => {
    surface.use((child) => {
      state.setups += 1
      state.status = child.available ? 'Ready' : 'Unavailable'
      try {
        child.set({ x: 12 })
      } catch {
        state.status = 'Unavailable'
      }
      return () => {
        state.cleanups += 1
        state.status = 'Cleaned'
      }
    })
  })
  return (
    <MColumn gap="sm">
      <Show when={state.visible}>
        <MBox motionSurface={surface}>
          <MText>Target</MText>
        </MBox>
      </Show>
      <MButton
        text="Toggle target"
        onClick={() => {
          state.visible = !state.visible
        }}
      />
      <MText>{state.status}</MText>
      <MText>{`Setups ${state.setups}`}</MText>
      <MText>{`Cleanups ${state.cleanups}`}</MText>
    </MColumn>
  )
}
