import { useStore } from '@builder.io/mitosis'

// This small, checked subset generates both Vue and SwiftUI.
// Edit this source, then run the generate command before rebuilding either host.
export default function Welcome() {
  const state = useStore({ sparks: 0 })
  return (
    <MColumn gap="xl">
      <MRow gap="sm">
        <MText variant="overline" tone="primary">
          MAVIS / FIRST LIGHT
        </MText>
        <MText variant="caption" tone="muted">
          Experimental · macOS + Web
        </MText>
      </MRow>
      <MColumn gap="sm">
        <MText variant="display">One idea.</MText>
        <MText variant="display" tone="primary">
          A new window.
        </MText>
        <MText tone="muted">Your first shared screen, now at home on the Mac.</MText>
      </MColumn>
      <MColumn gap="md" padding="lg">
        <MText variant="overline" tone="muted">
          MAKE A LITTLE MAGIC
        </MText>
        <MText variant="title">{state.sparks}</MText>
        <MText tone="muted">Sparks collected in this window.</MText>
        <MRow gap="sm">
          <MButton text="Add a spark" onClick={() => (state.sparks = state.sparks + 1)} />
          <MButton text="Start again" variant="secondary" onClick={() => (state.sparks = 0)} />
        </MRow>
      </MColumn>
      <MText variant="caption" tone="muted">
        One Welcome.lite.tsx · Vue on the Web · SwiftUI on macOS
      </MText>
    </MColumn>
  )
}
