import { useStore } from '@builder.io/mitosis'

export default function Practice() {
  const state = useStore({
    level: 10,
    picked: null as CivilDate | null,
    read: null as CivilDate | null,
    locked: false,
    week: [
      { date: '2026-09-06', value: 2, label: 'Sunday' },
      { date: '2026-09-07', value: 0, label: 'Monday' },
      { date: '2026-09-08', value: null, label: 'Tuesday' },
      { date: '2026-09-09', value: 4, label: 'Wednesday', disabled: true },
    ] as HeatmapValue[],
    get days(): HeatmapValue[] {
      return [
        { date: '2026-09-02', value: 10 },
        { date: '2026-09-09', value: state.level },
      ]
    },
    set(next: number) {
      state.level = next
    },
  })

  return (
    <MColumn id="page" gap="lg">
      <MColumn height={520}>
        <MBox id="cell" width={128} height={298} backgroundColor="#FFF4D6">
          <MColumn>
            <MHeatmap
              label="Days"
              start="2026-09-01"
              end="2026-09-14"
              values={state.days}
              value={state.picked}
              onChange={(value) => (state.picked = value)}
              colors={['#FFFFFF', '#88C0A8', '#2F7D6B']}
            />
          </MColumn>
        </MBox>
      </MColumn>
      <MRow gap="sm" wrap>
        <MButton text="Half" onClick={() => state.set(5)} />
        <MButton text="Zero" variant="secondary" onClick={() => state.set(0)} />
        <MButton text="Full" variant="secondary" onClick={() => state.set(10)} />
        <MButton text="Lock" variant="secondary" onClick={() => (state.locked = !state.locked)} />
      </MRow>
      <MText>{`Picked: ${state.picked ?? 'none'}`}</MText>
      <MText>{`Read: ${state.read ?? 'none'}`}</MText>
      <MHeatmap
        id="reading"
        label="Reading"
        start="2026-09-06"
        end="2026-09-12"
        values={state.week}
        value={state.read}
        onChange={(value) => (state.read = value)}
        weekStartsOn={0}
        cellSize={32}
        animated={false}
        disabled={state.locked}
        missingLabel="None"
        dataLabel="Week data"
        lessLabel="Fewer"
        moreLabel="Most"
        formatValue={(value) => `${value} h`}
      />
    </MColumn>
  )
}
