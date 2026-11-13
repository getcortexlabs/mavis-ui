import { pageTransition } from './page-transition'

export default function Home() {
  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText as="h1">Shared policy</MText>
        <MText>
          {pageTransition.name} {pageTransition.duration}
        </MText>
        <MButton text="Open detail" href="/details/42" />
      </MColumn>
    </MScreen>
  )
}
