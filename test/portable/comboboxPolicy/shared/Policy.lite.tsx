import { useStore } from '@builder.io/mitosis'
import { useSearchProbe } from './probe'
export default function Policy() {
  const store = useSearchProbe()
  const state = useStore({})
  return (
    <MColumn gap="md">
      <MText>{store.report.value}</MText>
      <MButton text="Run search checks" onClick={() => store.run()} />
    </MColumn>
  )
}
