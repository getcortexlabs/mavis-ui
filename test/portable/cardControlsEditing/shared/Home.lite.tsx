import { useStore } from '@builder.io/mitosis'
export default function Home() {
  const state = useStore({ cards: 0, children: 0, note: 'draft', disabled: false })
  return (
    <MColumn gap="sm" width={400}>
      <MCard
        label="Open collection"
        onClick={() => state.cards++}
        disabled={state.disabled}
        gap="sm"
      >
        <MButton text="Nested action" onClick={() => state.children++} />
        <MInput label="Note" value={state.note} onChange={(value) => (state.note = value)} />
        <MColumn height={220} />
      </MCard>
      <MButton text="Lock card" onClick={() => (state.disabled = true)} />
      <MText>{'Cards ' + state.cards + ' / Children ' + state.children + ' / ' + state.note}</MText>
    </MColumn>
  )
}
