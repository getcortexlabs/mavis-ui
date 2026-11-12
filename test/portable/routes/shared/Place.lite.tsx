import { useStore } from '@builder.io/mitosis'
import { venueAt } from './venues'
import type { Venue } from './venues'

export default function Place(props: { id: string }) {
  const navigation = useMavisNavigation()
  const state = useStore({
    get venue(): Venue | undefined {
      return venueAt(props.id)
    },
  })

  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText as="h1" variant="title">
          {state.venue?.name ?? 'Unknown place'}
        </MText>
        <MText tone="muted">{`In ${state.venue?.city ?? 'no city'}, as ${props.id}.`}</MText>
        <MRow gap="sm">
          <MButton text="Back" variant="secondary" onClick={() => navigation.back()} />
          <MButton text="Notes" href={`/places/${props.id}/notes`} />
        </MRow>
        <MLink href="/" text="All places" />
        <MLink
          href="/places/library"
          text="Swap for the library"
          navigate={(href) => navigation.replace(href)}
        />
      </MColumn>
    </MScreen>
  )
}
