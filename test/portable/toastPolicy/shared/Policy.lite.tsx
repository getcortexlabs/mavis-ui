import { useStore } from '@builder.io/mitosis'
import { useToastProbe } from './probe'
export default function Policy() {
  const store = useToastProbe()
  const state = useStore({})
  return (
    <MColumn gap="md">
      <MText>{store.report.value}</MText>
      <MButton text="Run toast checks" onClick={() => store.run()} />
    </MColumn>
  )
}
