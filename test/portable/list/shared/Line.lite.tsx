import { useRef, useStore } from '@builder.io/mitosis'
import type { Stop } from './types'

export default function Line() {
  const lineRef = useRef<MavisListRef>(null)
  const state = useStore({
    stops: [
      { id: 's01', name: 'Alder Gate' },
      { id: 's02', name: 'Birch Row' },
      { id: 's03', name: 'Cedar Hill' },
      { id: 's04', name: 'Dock Street' },
      { id: 's05', name: 'Elm Park' },
      { id: 's06', name: 'Fern Lane' },
      { id: 's07', name: 'Glen Cross' },
      { id: 's08', name: 'Harbor Quay' },
      { id: 's09', name: 'Iris Court' },
      { id: 's10', name: 'Juniper Way' },
      { id: 's11', name: 'Kestrel Rise' },
      { id: 's12', name: 'Larch Bend' },
      { id: 's13', name: 'Mill Pond' },
      { id: 's14', name: 'North Field' },
      { id: 's15', name: 'Oak Square' },
      { id: 's16', name: 'Pine Wharf' },
      { id: 's17', name: 'Quarry Road' },
      { id: 's18', name: 'Reed Bank' },
      { id: 's19', name: 'Spruce Yard' },
      { id: 's20', name: 'Thorn Vale' },
      { id: 's21', name: 'Union Bridge' },
      { id: 's22', name: 'Vine Terrace' },
      { id: 's23', name: 'Willow End' },
      { id: 's24', name: 'Yarrow Green' },
      { id: 's25', name: 'Zinnia Place' },
      { id: 's26', name: 'Aster Close' },
      { id: 's27', name: 'Bay View' },
      { id: 's28', name: 'Clover Mead' },
      { id: 's29', name: 'Dune Walk' },
      { id: 's30', name: 'East Shore' },
    ] as Stop[],
    jump() {
      lineRef.scrollToIndex(19)
    },
    start() {
      lineRef.scrollToIndex(0)
    },
    drop() {
      state.stops.splice(0, 1)
    },
    clear() {
      state.stops = []
    },
  })

  return (
    <MColumn gap="md">
      <MVirtualList
        ref={lineRef}
        id="line"
        label="Stops on the line"
        items={state.stops}
        rowHeight={48}
        height={240}
        overscan={0}
        slotEmpty={<MText>No stops yet</MText>}
      >
        {({ item, index, itemKey }) => (
          <MRow id={`stop-${itemKey}`} height={48} paddingX="md" align="center">
            <MText>{`${index + 1}. ${item.name}`}</MText>
          </MRow>
        )}
      </MVirtualList>
      <MRow gap="sm" wrap>
        <MButton text="Jump to 20" onClick={() => state.jump()} />
        <MButton text="Back to start" variant="secondary" onClick={() => state.start()} />
        <MButton text="Drop first" variant="secondary" onClick={() => state.drop()} />
        <MButton text="Clear" variant="ghost" onClick={() => state.clear()} />
      </MRow>
      <MVirtualList
        id="late"
        label="Later stops"
        items={state.stops}
        rowHeight={40}
        height={120}
        overscan={0}
        initialIndex={10}
        emptyLabel="Nothing later"
      >
        {({ item }) => (
          <MRow id={`late-${item.id}`} height={40} paddingX="md" align="center">
            <MText tone="muted">{item.name}</MText>
          </MRow>
        )}
      </MVirtualList>
    </MColumn>
  )
}
