import { useStore } from '@builder.io/mitosis'

export default function Activity() {
  const state = useStore({
    now: [{ key: 'now', label: 'Now' }] as ChartCategory[],
    load: [{ key: 'cpu', label: 'CPU', values: [100] }] as ChartSeries[],
    days: [
      { key: 'mon', label: 'Mon' },
      { key: 'tue', label: 'Tue' },
      { key: 'wed', label: 'Wed' },
      { key: 'thu', label: 'Thu' },
    ] as ChartCategory[],
    week: [
      { key: 'visits', label: 'Visits', values: [20, 40, 30, 10] },
      { key: 'saves', label: 'Saves', values: [10, null, 20, 5], color: '#2F7D6B' },
    ] as ChartSeries[],
    picked: null as ChartSelection | null,
    hidden: [] as string[],
    bars: false,
    locked: false,
    drop() {
      state.load = [{ key: 'cpu', label: 'CPU', values: [10] }]
    },
    rise() {
      state.load = [{ key: 'cpu', label: 'CPU', values: [100], color: '#2F7D6B' }]
    },
    next() {
      state.week = [
        { key: 'visits', label: 'Visits', values: [60, 80, 20, 40] },
        { key: 'saves', label: 'Saves', values: [30, 50, null, 25], color: '#2F7D6B' },
      ]
    },
    tue() {
      state.picked = { category: 'tue', series: 'visits' }
    },
    saves() {
      state.picked = { category: 'tue', series: 'saves' }
    },
  })

  return (
    <MColumn id="page" gap="lg">
      <MColumn height={640}>
        <MBox id="bar" height={420} backgroundColor="#FFF4D6">
          <MColumn>
            <MChart
              label="Load"
              type="bar"
              categories={state.now}
              series={state.load}
              domain={[0, 100]}
            />
          </MColumn>
        </MBox>
      </MColumn>
      <MRow gap="sm" wrap>
        <MButton text="Drop" onClick={() => state.drop()} />
        <MButton text="Rise" variant="secondary" onClick={() => state.rise()} />
        <MButton text="Next week" variant="secondary" onClick={() => state.next()} />
        <MButton text="Pick tue" variant="secondary" onClick={() => state.tue()} />
        <MButton text="Pick saves" variant="secondary" onClick={() => state.saves()} />
        <MButton text="Bars" variant="secondary" onClick={() => (state.bars = !state.bars)} />
        <MButton text="Lock" variant="secondary" onClick={() => (state.locked = !state.locked)} />
      </MRow>
      <MText>{`Picked: ${state.picked?.category ?? 'none'}/${state.picked?.series ?? 'none'}`}</MText>
      <MText>{`Hidden: ${state.hidden.join(', ')}.`}</MText>
      <MChart
        id="activity"
        label="Activity"
        description="Four days"
        type={state.bars ? 'bar' : 'line'}
        categories={state.days}
        series={state.week}
        height={200}
        value={state.picked}
        onChange={(value) => (state.picked = value)}
        hiddenSeries={state.hidden}
        onHiddenSeriesChange={(value) => (state.hidden = value)}
        disabled={state.locked}
        formatValue={(value) => `${value}k`}
        categoryLabel="Day"
        seriesLabel="Metric"
        missingLabel="Nothing"
      />
    </MColumn>
  )
}
