import { useStore } from '@builder.io/mitosis'
import { useFileProbe } from './probe'
export default function Policy() {
  const store = useFileProbe()
  const state = useStore({})
  return (
    <MColumn gap="md">
      <MText>{store.report.value}</MText>
      <MButton text="Run file checks" onClick={() => store.run()} />
    </MColumn>
  )
}
