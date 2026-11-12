import { useStore } from '@builder.io/mitosis'

// Texts, buttons, cards and a grid with the properties that are not layout between boxes:
// names, headings, sizes, variants, loading, shortcuts and a card's own box.
export default function Controls() {
  const state = useStore({
    count: 0,
    saving: false,
    locked: true,
    add(by: number) {
      state.count += by
    },
    save() {
      state.count += 10
      state.saving = true
    },
    finish() {
      state.saving = false
    },
    unlock() {
      state.locked = false
    },
  })
  return (
    <MColumn id="controls" gap="md" width={300}>
      <MText id="title" as="h1" variant="title">
        Controls
      </MText>
      <MText as="h2" variant="heading" weight="bold">
        Texts
      </MText>
      <MText id="count" accessibilityLabel={`Count: ${state.count}`}>
        {state.count}
      </MText>
      <MText accessibilityHidden>Decoration</MText>
      <MText variant="title" as="p" weight={state.locked ? '400' : '700'}>
        Large, not a heading
      </MText>
      <MColumn id="aligned" width={240} backgroundColor="#F1ECFF">
        <MText id="centered" align="center">
          Middle
        </MText>
        <MText id="right" align={state.locked ? 'right' : 'left'}>
          Edge
        </MText>
        <MText id="short">One line</MText>
      </MColumn>
      <MColumn id="narrow" width={120} backgroundColor="#F1ECFF">
        <MText id="single" wrap={false}>
          This text stays on one line whatever the width
        </MText>
      </MColumn>
      <MRow id="texts" width={240} gap="sm" backgroundColor="#F1ECFF">
        <MText id="grows" grow={1}>
          Grows
        </MText>
        <MText id="last">Last</MText>
      </MRow>
      <MRow id="tight" width={160} gap="sm" backgroundColor="#F1ECFF">
        <MText id="whole" shrink={0}>
          Kept whole
        </MText>
        <MText>This one wraps because it gives way</MText>
      </MRow>
      <MRow id="sizes" gap="sm" align="start" wrap>
        <MButton id="small" size="sm" text="Small" onClick={() => state.add(1)} />
        <MButton id="medium" text="Medium" variant="secondary" onClick={() => state.add(2)} />
        <MButton id="large" size="lg" variant="ghost" text="Large" onClick={() => state.add(3)} />
      </MRow>
      <MButton id="wide" text="Wide" variant="secondary" onClick={() => state.add(4)} />
      <MRow id="shared" width={240} gap="sm">
        <MButton id="first" grow={1} text="A" onClick={() => state.add(5)} />
        <MButton
          id="plus"
          shrink={0}
          text="+"
          accessibilityLabel="Add one"
          shortcut="mod+1"
          onClick={() => state.add(1)}
        />
      </MRow>
      <MRow gap="sm" wrap>
        <MButton text="Add five" shortcut="F2" onClick={() => state.add(5)} />
        <MButton
          text="Save"
          variant={state.saving ? 'secondary' : 'primary'}
          size={state.saving ? 'sm' : 'md'}
          loading={state.saving}
          loadingText="Saving…"
          loadingIndicator="dots"
          onClick={() => state.save()}
        />
        <MButton text="Finish" variant="ghost" onClick={() => state.finish()} />
        <MButton text="Wait" loading onClick={() => state.add(100)} />
      </MRow>
      <MCard
        accessibilityLabel="Locked card"
        disabled={state.locked}
        elevation="sm"
        onClick={() => state.add(50)}
      >
        <MText>Fifty more</MText>
      </MCard>
      <MRow>
        <MButton text="Unlock" variant="secondary" onClick={() => state.unlock()} />
      </MRow>
      <MRow id="cards" width={300} gap="sm" align="stretch">
        <MCard id="one" width={120} shrink={0} paddingX="md" paddingY="xs" radius="sm">
          <MText id="oneText">One</MText>
        </MCard>
        <MCard
          id="two"
          grow={1}
          padding="sm"
          radius={4}
          elevation={state.locked ? 'none' : 'md'}
          backgroundColor="#FFFFFF"
        >
          <MText id="twoText">Two</MText>
          <MText variant="caption">More</MText>
        </MCard>
      </MRow>
      <MGrid
        id="grid"
        width={220}
        columns={2}
        gap="sm"
        padding="sm"
        radius="sm"
        backgroundColor="#F1ECFF"
        accessibilityLabel="Pair"
      >
        <MColumn id="cellA" height={20} backgroundColor="#C8B6FF" />
        <MColumn id="cellB" height={20} backgroundColor="#B8C0FF" />
      </MGrid>
      <MCheckbox
        id="shadow"
        label="Shadow"
        checked={false}
        accessibilityHidden
        onChange={() => state.add(0)}
      />
    </MColumn>
  )
}
