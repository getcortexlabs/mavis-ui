import { onMount, onUnMount, useStore } from '@builder.io/mitosis'
import { useWork } from './work'

export default function Working(props: { onComplete: () => void; onDisposed: () => void }) {
  const work = useWork()
  const state = useStore({ active: true })
  onMount(async () => {
    await work.load()
    if (state.active) props.onComplete()
  })
  onUnMount(() => {
    state.active = false
    work.cancel()
    props.onDisposed()
  })
  return <MText>Working child</MText>
}
