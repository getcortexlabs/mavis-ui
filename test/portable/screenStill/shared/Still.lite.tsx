export default function Still() {
  return (
    <MScreen id="still">
      <MColumn id="still-content" padding="lg" gap="md">
        <MText id="still-title" variant="title" as="h1">
          A screen that stays
        </MText>
        <MText>Without scroll the content fills the window and does not move.</MText>
        <MColumn id="still-gap" height={48} />
      </MColumn>
    </MScreen>
  )
}
