import { useStore } from '@builder.io/mitosis'

export default function Links() {
  const state = useStore({
    opened: 'nowhere',
    clicks: 0,
    off: false,
    go(href: string) {
      state.opened = href
    },
  })

  return (
    <MColumn id="page" gap="md">
      <MLink
        id="docs"
        href="https://mavis.example/docs"
        text="Documentation"
        navigate={(href) => state.go(href)}
        onClick={() => (state.clicks = state.clicks + 1)}
      />
      <MRow gap="xs">
        <MText id="lead" grow={0}>
          Read the
        </MText>
        <MLink
          id="guide"
          href="/guide"
          text="guide"
          inline
          disabled={state.off}
          navigate={(href) => state.go(href)}
        />
      </MRow>
      <MText>{`Opened ${state.opened}, ${state.clicks} clicks`}</MText>
      <MButton text="Turn off" variant="secondary" onClick={() => (state.off = !state.off)} />
    </MColumn>
  )
}
