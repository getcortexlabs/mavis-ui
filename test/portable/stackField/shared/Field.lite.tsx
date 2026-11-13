import { useStore } from '@builder.io/mitosis'

export default function Field() {
  const state = useStore({ name: '', wide: false })

  return (
    <MScreen id="field-screen">
      <MColumn padding="lg" gap="sm">
        <MText>Return switches the width</MText>
        <MColumn id="field-box" width={state.wide ? 340 : 240}>
          <MStack id="field-stack" gap="sm" responsive={{ at: 300, direction: 'row' }}>
            <MColumn id="field-input" grow={1}>
              <MInput
                label="Name"
                value={state.name}
                onChange={(value) => (state.name = value)}
                onSubmit={() => (state.wide = !state.wide)}
              />
            </MColumn>
            <MText id="field-width">{state.wide ? 'Wide' : 'Narrow'}</MText>
          </MStack>
        </MColumn>
      </MColumn>
    </MScreen>
  )
}
