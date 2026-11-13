export default function Details() {
  const toast = useToast({ scope: 'app' })
  return (
    <MScreen>
      <MText>Details</MText>
      <MButton text="Dismiss current" onClick={() => toast.dismiss()} />
      <MButton text="Clear notifications" onClick={() => toast.clear()} />
      <MButton text="Home" href="/" />
    </MScreen>
  )
}
