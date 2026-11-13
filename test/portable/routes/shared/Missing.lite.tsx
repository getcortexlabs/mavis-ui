export default function Missing() {
  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText as="h1" variant="title">
          Nothing here
        </MText>
        <MText tone="muted">That address is not a place of this app.</MText>
        <MLink href="/" text="Back to places" />
      </MColumn>
    </MScreen>
  )
}
