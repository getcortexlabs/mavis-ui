export default function Search(props: { q?: string; sort?: string }) {
  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText as="h1" variant="title">{`Results for ${props.q ?? 'everything'}`}</MText>
        <MText>{`Sorted by ${props.sort ?? 'name'}.`}</MText>
        <MLink href="/search?q=green%20tea&sort=city" text="Green tea by city" />
      </MColumn>
    </MScreen>
  )
}
