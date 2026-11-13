export default function Notes(props: { id: string }) {
  const navigation = useMavisNavigation()

  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText as="h1" variant="title">
          Notes
        </MText>
        <MText>{`Nothing written about ${props.id} yet.`}</MText>
        <MButton text="Done" onClick={() => navigation.back()} />
      </MColumn>
    </MScreen>
  )
}
