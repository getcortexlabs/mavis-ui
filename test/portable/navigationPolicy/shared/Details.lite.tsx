export default function Details(props: { id: string }) {
  const navigation = useMavisNavigation()
  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText as="h1">Detail {props.id}</MText>
        <MButton text="Return home" onClick={() => navigation.back()} />
      </MColumn>
    </MScreen>
  )
}
