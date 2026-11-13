import { useStore } from '@builder.io/mitosis'
import type { Track } from './types'

export default function Queue() {
  const state = useStore({
    tracks: [
      { id: 'night', title: 'Night Drive', artist: 'Kavinsky' },
      { id: 'tide', title: 'High Tide', artist: 'Tycho' },
      { id: 'dawn', title: 'First Light', artist: 'Bonobo' },
    ] as Track[],
    fixed: [
      { id: 'intro', title: 'Intro', artist: 'House band' },
      { id: 'outro', title: 'Outro', artist: 'House band' },
    ] as Track[],
    none: [] as Track[],
    last: 'nothing',
    locked: false,
    moved(move: SortableMove) {
      state.last = `${move.key} before ${move.beforeKey ?? 'the end'}, ${move.fromIndex} to ${move.toIndex}`
    },
  })

  return (
    <MColumn gap="md">
      <MSortableList
        id="queue"
        label="Up next"
        value={state.tracks}
        onChange={(value) => (state.tracks = value)}
        onReorder={(move) => state.moved(move)}
        itemLabel={(item) => item.title}
        height={440}
        disabled={state.locked}
      >
        {({ item, index, itemKey }) => (
          <MColumn id={`track-${itemKey}`} gap="xs">
            <MText weight="600">{`${index + 1}. ${item.title}`}</MText>
            <MText variant="caption" tone="muted">
              {item.artist}
            </MText>
          </MColumn>
        )}
      </MSortableList>
      <MRow gap="sm">
        <MButton
          text={state.locked ? 'Unlock' : 'Lock'}
          variant="secondary"
          onClick={() => (state.locked = !state.locked)}
        />
        <MText>{`Last move: ${state.last}`}</MText>
      </MRow>
      <MSortableList
        label="Fixed order"
        value={state.fixed}
        itemLabel={(item) => item.title}
        height={300}
        handleLabel="Drag"
        moveUpLabel="Earlier"
        moveDownLabel="Later"
      />
      <MSortableList label="Later" value={state.none} height={64} emptyLabel="Nothing queued" />
    </MColumn>
  )
}
