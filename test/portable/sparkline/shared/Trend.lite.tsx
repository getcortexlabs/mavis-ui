import { useStore } from '@builder.io/mitosis'

export default function Trend() {
  const state = useStore({
    replies: [
      { id: 'mon', label: 'Mon', value: 12 },
      { id: 'tue', label: 'Tue', value: 18 },
      { id: 'wed', label: 'Wed', value: null },
      { id: 'thu', label: 'Thu', value: 9 },
      { id: 'fri', label: 'Fri', value: 24 },
    ] as SparklinePoint[],
    level: 0,
    quiet: [] as SparklinePoint[],
    get flat(): SparklinePoint[] {
      return [
        { id: 'start', label: 'Start', value: state.level },
        { id: 'end', label: 'End', value: state.level },
      ]
    },
    get broken(): SparklinePoint[] {
      return [
        { id: 'left', label: 'Left', value: 0 },
        { id: 'middle', label: 'Middle', value: null },
        { id: 'right', label: 'Right', value: 0 },
      ]
    },
    raise() {
      state.level = state.level === 0 ? 10 : 0
    },
    next() {
      state.replies = [
        { id: 'mon', label: 'Mon', value: 30 },
        { id: 'tue', label: 'Tue', value: null },
        { id: 'wed', label: 'Wed', value: 21.5 },
      ]
    },
    hear() {
      state.quiet = [{ id: 'only', label: 'Only', value: 7 }]
    },
  })

  return (
    <MColumn id="page" gap="lg">
      <MBox id="level" height={180} backgroundColor="#FFF4D6">
        <MColumn>
          <MSparkline
            label="Level"
            points={state.flat}
            domain={[0, 10]}
            height={100}
            color="#2F7D6B"
            dataLabel="Level data"
          />
        </MColumn>
      </MBox>
      <MBox id="plain" height={180} backgroundColor="#FFF4D6">
        <MColumn>
          <MSparkline
            label="Plain"
            points={state.flat}
            domain={[0, 10]}
            height={100}
            animated={false}
            dataLabel="Plain data"
          />
        </MColumn>
      </MBox>
      <MBox id="gap" height={180} backgroundColor="#FFF4D6">
        <MColumn>
          <MSparkline
            label="Gap"
            points={state.broken}
            domain={[0, 10]}
            height={100}
            color="#2F7D6B"
            dataLabel="Gap data"
          />
        </MColumn>
      </MBox>
      <MRow gap="sm" wrap>
        <MButton text="Raise" onClick={() => state.raise()} />
        <MButton text="Next week" variant="secondary" onClick={() => state.next()} />
        <MButton text="Hear" variant="secondary" onClick={() => state.hear()} />
      </MRow>
      <MSparkline
        id="replies"
        label="Replies"
        points={state.replies}
        formatValue={(value) => `${value} ms`}
      />
      <MSparkline
        label="Quiet"
        points={state.quiet}
        showData
        emptyLabel="Nothing yet"
        dataLabel="Quiet data"
      />
    </MColumn>
  )
}
