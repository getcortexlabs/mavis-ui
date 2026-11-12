import { useStore } from '@builder.io/mitosis'

export default function Icons() {
  const state = useStore({
    symbol: 'plus' as MavisIconName,
    tone: 'primary' as 'primary' | 'danger',
    scale: 'sm' as 'sm' | 'lg',
    points: 32,
    saved: false,
    grow() {
      state.scale = 'lg'
      state.points = 40
    },
  })

  return (
    <MColumn gap="md">
      <MRow id="search-row" gap="sm">
        <MIcon id="search" name="search" tone="muted" />
        <MText>Search</MText>
      </MRow>
      <MRow id="sizes" gap="md" align="end">
        <MIcon id="size-sm" name="star" size="sm" />
        <MIcon id="size-md" name="star" />
        <MIcon id="size-lg" name="star" size="lg" />
        <MIcon id="size-named" name="star" size={state.scale} />
        <MIcon id="size-points" name="star" size={state.points} />
      </MRow>
      <MRow id="tray" gap="md" padding="md" radius="md" backgroundColor="#F4E9FF">
        <MIcon id="glyph" name={state.symbol} size={48} tone={state.tone} />
        <MIcon id="fixed" name="minus" size={48} tone="success" />
      </MRow>
      <MColumn id="column" width={200}>
        <MIcon id="in-column" name="bell" />
        <MText>Below the bell</MText>
      </MColumn>
      <MRow gap="sm">
        <MIcon
          id="status"
          name={state.saved ? 'circle-check' : 'circle'}
          tone="success"
          label={state.saved ? 'Saved' : 'Not saved'}
        />
        <MText>{state.saved ? 'Saved' : 'Draft'}</MText>
      </MRow>
      <MRow gap="sm" wrap>
        <MButton
          text="Change icon"
          onClick={() => (state.symbol = state.symbol === 'plus' ? 'circle' : 'plus')}
        />
        <MButton
          text="Change tone"
          onClick={() => (state.tone = state.tone === 'primary' ? 'danger' : 'primary')}
        />
        <MButton text="Grow" onClick={() => state.grow()} />
        <MButton text="Save" onClick={() => (state.saved = true)} />
      </MRow>
    </MColumn>
  )
}
