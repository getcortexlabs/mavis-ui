import { useStore } from '@builder.io/mitosis'
export default function Details() {
  const state = useStore({ show: false, name: '' })
  return (
    <MColumn gap="lg">
      <MButton
        text={state.show ? 'Hide details' : 'Show details'}
        onClick={() => (state.show = !state.show)}
      />
      <MReveal show={state.show} gap="sm" padding="md" backgroundColor="#eef3e8" radius="md">
        <MText id="reveal-title">Details</MText>
        <MText id="reveal-note">A column with its own spacing</MText>
        <MInput label="Name" value={state.name} onChange={(value) => (state.name = value)} />
        <MButton text="Close details" onClick={() => (state.show = false)} />
      </MReveal>
      <MText>Tail</MText>
    </MColumn>
  )
}
