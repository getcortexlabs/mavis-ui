import { useStore } from '@builder.io/mitosis'
export default function Home() {
  const state = useStore({
    categories: [
      { key: 'mon', label: 'Mon' },
      { key: 'tue', label: 'Tue' },
    ] as ChartCategory[],
    series: [
      { key: 'visits', label: 'Visits', values: [20, 60] },
      { key: 'saves', label: 'Saves', values: [80, null] },
    ] as ChartSeries[],
    picked: null as ChartSelection | null,
    hidden: [] as string[],
    bars: false,
    disabled: false,
    changes: 0,
  })
  return (
    <MColumn gap="sm">
      <MText id="outside">Outside plot</MText>
      <MChart
        id="hover-chart"
        label="Hover chart"
        description="Overview"
        categories={state.categories}
        series={state.series}
        domain={[0, 100]}
        height={200}
        type={state.bars ? 'bar' : 'line'}
        value={state.picked}
        onChange={(next) => {
          state.picked = next
          state.changes += 1
        }}
        disabled={state.disabled}
        hiddenSeries={state.hidden}
        onHiddenSeriesChange={(keys) => (state.hidden = keys)}
      />
      <MText>{`Picked ${state.picked?.category ?? 'none'}/${state.picked?.series ?? 'none'}`}</MText>
      <MText>{`Changes ${state.changes}`}</MText>
      <MButton text="Bars" onClick={() => (state.bars = !state.bars)} />
      <MButton text="Lock" onClick={() => (state.disabled = !state.disabled)} />
      <MButton
        text="Pin Tuesday"
        onClick={() => (state.picked = { category: 'tue', series: 'visits' })}
      />
    </MColumn>
  )
}
