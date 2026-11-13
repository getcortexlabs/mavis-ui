import { For, useStore } from '@builder.io/mitosis'
import { venues } from './venues'

export default function Home() {
  const navigation = useMavisNavigation()
  const state = useStore({
    surprise() {
      navigation.push('/places/studio')
    },
  })

  return (
    <MScreen scroll>
      <MColumn id="home" padding="lg" gap="md">
        <MText as="h1" variant="title">
          Places
        </MText>
        <MText tone="muted">{venues.length} places to visit.</MText>
        <For each={venues}>
          {(venue) => (
            <MCard
              key={venue.id}
              id={`place-${venue.id}`}
              href={`/places/${venue.id}`}
              accessibilityLabel={`Open ${venue.name}`}
              gap="xs"
            >
              <MText variant="heading">{venue.name}</MText>
              <MText tone="muted">{venue.city}</MText>
            </MCard>
          )}
        </For>
        <MButton id="surprise" text="Surprise me" onClick={() => state.surprise()} />
        <MLink id="search" href="/search?q=tea" text="Search tea" />
        <MRow id="more" gap="md">
          <MLink id="nowhere" href="/nowhere" text="Nowhere" />
          <MLink id="closed" href="/places/garden" text="Closed today" disabled />
        </MRow>
      </MColumn>
    </MScreen>
  )
}
