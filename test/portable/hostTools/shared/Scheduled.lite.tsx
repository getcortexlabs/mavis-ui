import { onMount, onUnMount } from '@builder.io/mitosis'
import { useUtilities } from './utilities'
export default function Scheduled() {
  const tools = useUtilities()
  onMount(async () => {
    await tools.run(10000)
  })
  onUnMount(() => {
    tools.cancel()
  })
  return <MText>Scheduled child</MText>
}
