import { useStore } from '@builder.io/mitosis'

// Colored boxes with ids: each section lays them out one way, and the steps check where they land.
export default function Layout() {
  const state = useStore({
    step: 0,
    next() {
      state.step = state.step === 4 ? 0 : state.step + 1
    },
  })
  return (
    <MColumn id="page" gap="md" width={300}>
      <MText>{`Step ${state.step}`}</MText>
      <MRow>
        <MButton text="Next" onClick={() => state.next()} />
      </MRow>
      <MRow
        id="justify"
        gap="sm"
        width={240}
        justify={
          state.step === 0
            ? 'start'
            : state.step === 1
              ? 'center'
              : state.step === 2
                ? 'end'
                : state.step === 3
                  ? 'between'
                  : 'around'
        }
      >
        <MColumn id="j1" width={40} height={24} backgroundColor="#C8B6FF" />
        <MColumn id="j2" width={40} height={24} backgroundColor="#B8C0FF" />
        <MColumn id="j3" width={40} height={24} backgroundColor="#BBD0FF" />
      </MRow>
      <MRow
        id="align"
        gap="sm"
        height={60}
        backgroundColor="#F1ECFF"
        align={
          state.step === 0
            ? 'start'
            : state.step === 1
              ? 'center'
              : state.step === 2
                ? 'end'
                : 'stretch'
        }
      >
        <MColumn id="a1" width={40} height={20} backgroundColor="#C8B6FF" />
        <MColumn id="a2" width={40} backgroundColor="#B8C0FF">
          <MText variant="caption">A</MText>
        </MColumn>
      </MRow>
      <MRow id="rowDefault" height={60} backgroundColor="#F1ECFF">
        <MColumn id="r1" width={40} height={20} backgroundColor="#C8B6FF" />
      </MRow>
      <MColumn id="columnDefault" width={200} backgroundColor="#F1ECFF">
        <MColumn id="c1" height={20} backgroundColor="#C8B6FF" />
      </MColumn>
      <MColumn id="columnCenter" width={200} align="center" gap={12} backgroundColor="#F1ECFF">
        <MColumn id="cc1" width={40} height={20} backgroundColor="#C8B6FF" />
        <MColumn id="cc2" width={80} height={20} backgroundColor="#B8C0FF" />
      </MColumn>
      <MColumn
        id="columnEnd"
        width={200}
        height={60}
        align="end"
        justify="end"
        backgroundColor="#F1ECFF"
      >
        <MColumn id="ce1" width={40} height={20} backgroundColor="#C8B6FF" />
      </MColumn>
      <MRow id="wrap" gap="sm" width={200} wrap>
        <MColumn id="w1" width={80} height={24} backgroundColor="#C8B6FF" />
        <MColumn id="w2" width={80} height={24} backgroundColor="#B8C0FF" />
        <MColumn id="w3" width={80} height={24} backgroundColor="#BBD0FF" />
        <MColumn id="w4" width={80} height={24} backgroundColor="#C8B6FF" />
      </MRow>
      <MRow id="shrink" gap="sm" width={200}>
        <MColumn id="s1" width={80} height={24} backgroundColor="#C8B6FF" />
        <MColumn id="s2" width={80} height={24} backgroundColor="#B8C0FF" />
        <MColumn id="s3" width={80} height={24} backgroundColor="#BBD0FF" />
        <MColumn id="s4" width={80} height={24} backgroundColor="#C8B6FF" />
      </MRow>
      <MRow id="keep" gap="sm" width={200}>
        <MColumn id="k1" width={120} height={24} shrink={0} backgroundColor="#C8B6FF" />
        <MColumn id="k2" width={120} height={24} backgroundColor="#B8C0FF" />
      </MRow>
      <MRow id="grow" gap="sm" width={240}>
        <MColumn id="g1" width={40} height={24} backgroundColor="#C8B6FF" />
        <MColumn id="g2" grow={1} height={24} backgroundColor="#B8C0FF" />
        <MColumn id="g3" width={40} height={24} backgroundColor="#BBD0FF" />
      </MRow>
      <MRow id="shares" width={240}>
        <MColumn id="h1" grow={1} height={24} backgroundColor="#C8B6FF" />
        <MColumn id="h2" grow={3} height={24} backgroundColor="#B8C0FF" />
      </MRow>
      <MColumn id="tall" width={80} height={120} gap="sm" backgroundColor="#F1ECFF">
        <MColumn id="t1" height={20} backgroundColor="#C8B6FF" />
        <MColumn id="t2" grow={1} backgroundColor="#B8C0FF" />
      </MColumn>
      <MColumn id="padded" width={200} padding="md" radius="md" backgroundColor="#F1ECFF">
        <MColumn id="p1" height={20} backgroundColor="#C8B6FF" />
      </MColumn>
      <MColumn
        id="axes"
        width={200}
        paddingX="lg"
        paddingY="xs"
        radius={6}
        backgroundColor="#F1ECFF"
      >
        <MColumn id="p2" height={20} backgroundColor="#C8B6FF" />
      </MColumn>
      <MRow id="percent" width={240} height={80} align="start" backgroundColor="#F1ECFF">
        <MColumn id="half" width="50%" height="50%" backgroundColor="#C8B6FF" />
        <MColumn id="auto" width="auto" height={20} backgroundColor="#B8C0FF">
          <MText variant="caption">auto</MText>
        </MColumn>
      </MRow>
    </MColumn>
  )
}
