import { useStore } from '@builder.io/mitosis'

export default function Layers() {
  const state = useStore({ poured: 0 })

  return (
    <MColumn gap="md">
      <MText id="story" variant="title" as="h2">
        Each cup{' '}
        <MSpan emphasis="em" tone="primary">
          tells a story
        </MSpan>
        ,{' '}
        <MSpan emphasis="strong">
          brewed{' '}
          <MSpan weight="normal" tone="muted">
            slowly
          </MSpan>
        </MSpan>
        .
      </MText>
      <MRow gap="sm">
        <MButton text="Pour" onClick={() => (state.poured += 1)} />
        <MText id="poured">
          Poured <MSpan weight="bold">{state.poured}</MSpan> times
          <MSpan text="." />
        </MText>
      </MRow>
      <MBox id="box" radius="md" backgroundColor="#202C25">
        <MColumn id="box-back" padding="lg" gap="sm">
          <MText tone="onPrimary">Behind</MText>
          <MColumn id="box-swatch" height={24} />
          <MText tone="onPrimary">Under the badge</MText>
        </MColumn>
        <MColumn id="box-front" justify="end" align="end" padding="md">
          <MCard id="box-badge" padding="sm">
            <MText>Badge</MText>
          </MCard>
        </MColumn>
      </MBox>
      <MBox id="box-fixed" height={80} backgroundColor="#E9DDF7">
        <MColumn id="box-fixed-layer" padding="sm">
          <MText>Fills</MText>
        </MColumn>
      </MBox>
      <MRow id="box-row" gap="md" align="stretch">
        <MBox id="box-stretched" grow={1} backgroundColor="#E9DDF7">
          <MColumn id="box-stretched-layer" padding="sm">
            <MText>Short</MText>
          </MColumn>
        </MBox>
        <MColumn id="box-tall" grow={1} height={96}>
          <MText>Tall</MText>
        </MColumn>
      </MRow>
      <MColumn id="separators" padding="md">
        <MColumn id="separator-above">
          <MText>Above</MText>
        </MColumn>
        <MSeparator id="separator-auto" spacing="sm" inset="md" />
        <MColumn id="separator-below">
          <MText>Below</MText>
        </MColumn>
        <MSeparator id="separator-fixed" length={120} />
      </MColumn>
      <MRow id="separator-row">
        <MColumn id="separator-left">
          <MText>12 projects</MText>
        </MColumn>
        <MSeparator id="separator-vertical" orientation="vertical" spacing="md" />
        <MColumn id="separator-right">
          <MText>4 people</MText>
        </MColumn>
      </MRow>
    </MColumn>
  )
}
