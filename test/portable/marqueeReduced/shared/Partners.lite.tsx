import { useStore } from '@builder.io/mitosis'
type Partner = { id: number; label: string }
export default function Partners() {
  const state = useStore({
    items: [
      { id: 1, label: 'Mavis' },
      { id: 2, label: 'Jolt' },
    ] as Partner[],
    paused: false,
    autoplay: false,
  })
  return (
    <MColumn gap="md">
      <MMarquee
        label="Shared tools"
        items={state.items}
        paused={state.paused}
        autoplay={state.autoplay}
        direction="right"
        itemWidth={120}
        gap={8}
      />
      <MButton text="Request autoplay" onClick={() => (state.autoplay = true)} />
      <MButton text="Pause from parent" onClick={() => (state.paused = true)} />
      <MButton text="Remove first" onClick={() => (state.items = state.items.slice(1))} />
    </MColumn>
  )
}
