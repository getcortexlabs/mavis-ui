import { useStore } from '@builder.io/mitosis'
import type { Notice } from './types'
export default function Inbox() {
  const state = useStore({
    items: [
      { id: 'build', title: 'Build ready', group: 'Studio', actionLabel: 'Open build', stamp: 7 },
      { id: 'lock', title: 'Protected note', group: 'Studio', disabled: true, stamp: 9 },
      { id: 'done', title: 'Already read', read: true, dismissible: false, stamp: 11 },
    ] as Notice[],
    filter: 'all' as 'all' | 'unread',
    action: 'none',
  })
  return (
    <MColumn gap="md">
      <MNotificationCenter
        label="Inbox"
        value={state.items}
        onChange={(items) => (state.items = items)}
        filter={state.filter}
        onUpdateFilter={(filter) => (state.filter = filter)}
        onAction={(id) => (state.action = id)}
      />
      <MText>Action: {state.action}</MText>
      <MText>Metadata: {state.items.map((item) => String(item.stamp)).join(',')}</MText>
    </MColumn>
  )
}
