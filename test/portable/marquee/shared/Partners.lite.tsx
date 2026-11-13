import { useStore } from '@builder.io/mitosis'
type Partner = { id: string; label: string }
export default function Partners() {
  const state = useStore({
    items: [
      { id: 'mavis', label: 'Mavis' },
      { id: 'jolt', label: 'Jolt' },
    ] as Partner[],
    paused: false,
    updates: 0,
  })
  return (
    <MColumn gap="md">
      <MMarquee
        label="Made together"
        items={state.items}
        paused={state.paused}
        speed={80}
        onUpdatePaused={(next) => {
          state.paused = next
          state.updates += 1
        }}
      />
      <MText>{`Updates ${state.updates}`}</MText>
    </MColumn>
  )
}
