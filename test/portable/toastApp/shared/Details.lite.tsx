export default function Details() {
  const toast = useToast({ scope: 'app' })
  return (
    <MScreen>
      <MColumn align="start" gap="md">
        <MText>Details</MText>
        <MButton text="Dismiss current" onClick={() => toast.dismiss()} />
        <MButton text="Clear notifications" onClick={() => toast.clear()} />
        <MButton text="Home" href="/" />
      </MColumn>
    </MScreen>
  )
}
