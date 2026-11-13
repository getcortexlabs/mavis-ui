import { useStore } from '@builder.io/mitosis'

export default function Stack() {
  const state = useStore({ wide: false })

  return (
    <MScreen id="stack-screen">
      <MStack
        id="stack-window"
        padding="lg"
        gap="sm"
        responsive={[
          { at: 720, direction: 'row', justify: 'between' },
          { at: 400, gap: 'lg' },
        ]}
      >
        <MCard id="window-one" padding="sm">
          <MText>One</MText>
        </MCard>
        <MCard id="window-two" padding="sm">
          <MText>Two</MText>
        </MCard>
        <MCard id="window-three" padding="sm">
          <MText>Three</MText>
        </MCard>
      </MStack>
      <MColumn paddingX="lg" gap="sm">
        <MButton
          text={state.wide ? 'Narrow' : 'Widen'}
          onClick={() => (state.wide = !state.wide)}
        />
        <MColumn id="stack-box" width={state.wide ? 340 : 240}>
          <MStack id="stack-inner" gap="sm" responsive={{ at: 300, direction: 'row', gap: 'md' }}>
            <MCard id="inner-one" padding="sm">
              <MText>Left</MText>
            </MCard>
            <MCard id="inner-two" padding="sm">
              <MText>Right</MText>
            </MCard>
          </MStack>
        </MColumn>
      </MColumn>
    </MScreen>
  )
}
