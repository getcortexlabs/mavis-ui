import { useStore, onMount, Show } from '@builder.io/mitosis'
import {
  createMotionSurface,
  createMotionRegion,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'
export default function Home() {
  const surface = createMotionSurface()
  const region = createMotionRegion()
  const state = useStore({ visible: true, setups: 0, cleanups: 0 })
  onMount(() => {
    whenMotionAvailable([surface, region], () => {
      state.setups += 1
      return () => {
        state.cleanups += 1
      }
    })
  })
  return (
    <MColumn gap="sm">
      <Show when={state.visible}>
        <MBox motionSurface={surface} motionRegion={region}>
          <MText>Target</MText>
        </MBox>
      </Show>
      <MButton
        text="Toggle target"
        onClick={() => {
          state.visible = !state.visible
        }}
      />
      <MText>{`Setups ${state.setups}`}</MText>
      <MText>{`Cleanups ${state.cleanups}`}</MText>
    </MColumn>
  )
}
