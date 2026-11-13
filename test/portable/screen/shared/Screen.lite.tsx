import { For, useStore } from '@builder.io/mitosis'

export default function Screen() {
  const state = useStore({
    count: 0,
    cards: [
      'North',
      'East',
      'South',
      'West',
      'Harbor',
      'Ridge',
      'Meadow',
      'Grove',
      'Shore',
      'Peak',
    ],
  })

  return (
    <MScreen
      id="screen"
      scroll
      slotOverlay={
        <MColumn id="screen-overlay" padding="md">
          <MCard id="screen-bar" padding="md">
            <MText weight="bold">Held over the content</MText>
          </MCard>
        </MColumn>
      }
    >
      <MColumn id="screen-content" paddingX="lg" paddingY={96} gap="md">
        <MText id="screen-first" variant="title" as="h1">
          A screen of its own
        </MText>
        <MButton id="screen-count" text="Count" onClick={() => (state.count += 1)} />
        <MText>{`Counted ${state.count}`}</MText>
        <MColumn id="screen-gap" height={48} />
        <For each={state.cards}>
          {(card) => (
            <MCard key={card} height={120}>
              <MText>{card}</MText>
            </MCard>
          )}
        </For>
      </MColumn>
    </MScreen>
  )
}
