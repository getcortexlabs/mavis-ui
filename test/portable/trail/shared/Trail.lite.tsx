import { Show, useStore } from '@builder.io/mitosis'
import type { Stage } from './types'

export default function Trail() {
  const state = useStore({
    events: [
      {
        key: 'order',
        title: 'Order placed',
        time: '09:12',
        description: 'Paid by card',
        icon: 'shopping-bag',
      },
      { key: 'pack', title: 'Packed', status: 'current' },
      { key: 'ship', title: 'Shipped', status: 'upcoming' },
    ] as TimelineItem[],
    stages: [
      { key: 'draft', title: 'Draft', status: 'complete' },
      { key: 'review', title: 'Review', status: 'current' },
    ] as Stage[],
    none: [] as Stage[],
    advance() {
      state.events.splice(1, 2, { key: 'pack', title: 'Packed' })
      state.events.push({ key: 'ship', title: 'Shipped', status: 'current' })
    },
    delay() {
      state.events.splice(2, 1, { key: 'ship', title: 'Shipped', status: 'error' })
      state.events.push({ key: 'done', title: 'Delivered', status: 'upcoming' })
    },
  })

  return (
    <MColumn gap="lg">
      <MTimeline id="trail" label="Order activity" items={state.events}>
        {({ item }) => (
          <MColumn id={`note-${item.key}`}>
            <Show when={item.key === 'order'}>
              <MText variant="caption">Receipt sent</MText>
            </Show>
          </MColumn>
        )}
      </MTimeline>
      <MRow gap="sm">
        <MButton text="Advance" onClick={() => state.advance()} />
        <MButton text="Delay" variant="secondary" onClick={() => state.delay()} />
        <MButton text="Clear" variant="ghost" onClick={() => (state.events = [])} />
      </MRow>
      <MTimeline
        label="Stages"
        items={state.stages}
        statusLabels={{ complete: 'Feito', current: 'Agora', upcoming: 'Depois', error: 'Erro' }}
      >
        {({ item, index }) => <MText tone="muted">{`${index + 1}. ${item.title}`}</MText>}
      </MTimeline>
      <MTimeline label="Later" items={state.none} emptyLabel="Nothing planned" />
    </MColumn>
  )
}
