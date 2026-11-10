import { useStore, Show } from '@builder.io/mitosis'

// This checked subset generates every target. Edit it, then run the generate command.
export default function Welcome() {
  const state = useStore({ sparks: 0 })
  return (
    <MColumn gap="xl">
      <MRow gap="sm">
        <MText variant="overline" tone="primary">
          MAVIS / FIRST LIGHT
        </MText>
        <MText variant="caption" tone="muted">
          Experimental · __MAVIS_TARGETS__
        </MText>
      </MRow>
      <MColumn gap="sm">
        <MText variant="display">One idea.</MText>
        <MText variant="display" tone="primary">
          A new window.
        </MText>
        <MText tone="muted">Your first shared screen, at home on every target.</MText>
      </MColumn>
      <MColumn gap="md" padding="lg">
        <MText variant="overline" tone="muted">
          MAKE A LITTLE MAGIC
        </MText>
        <MText variant="title">{state.sparks}</MText>
        <MText tone="muted">Sparks collected in this window.</MText>
        <Show when={state.sparks > 0} animate>
          <MText tone="primary">Motion runs through Jolt on every target.</MText>
        </Show>
        <MRow gap="sm">
          <MButton text="Add a spark" onClick={() => (state.sparks = state.sparks + 1)} />
          <MButton text="Start again" variant="secondary" onClick={() => (state.sparks = 0)} />
        </MRow>
      </MColumn>
      <MText variant="caption" tone="muted">
        One Welcome.lite.tsx · __MAVIS_HOSTS__
      </MText>
    </MColumn>
  )
}
