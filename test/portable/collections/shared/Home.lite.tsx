import { useStore } from '@builder.io/mitosis'
import { setSummary, mapSummary, keySummary } from './calculations'
export default function Home() {
  const state = useStore({ runs: 0 })
  return (
    <MColumn gap="sm">
      <MText>{setSummary()}</MText>
      <MText>{mapSummary()}</MText>
      <MText>{keySummary()}</MText>
      <MText>{`Runs ${state.runs}`}</MText>
      <MButton
        text="Calculate again"
        onClick={() => {
          state.runs += 1
        }}
      />
    </MColumn>
  )
}
