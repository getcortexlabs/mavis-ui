import { useStore } from '@builder.io/mitosis'
export default function Mail() {
  const state = useStore({
    side: null as SwipeSide,
    locked: false,
    last: 'none',
    start: [{ value: 'archive', label: 'Archive', icon: 'archive' }] as SwipeAction[],
    end: [
      { value: 'delete', label: 'Delete', destructive: true },
      { value: 'pin', label: 'Pin', disabled: true },
    ] as SwipeAction[],
  })
  return (
    <MColumn gap="md">
      <MSwipeActions
        label="Message actions"
        value={state.side}
        onChange={(value) => (state.side = value)}
        start={state.start}
        end={state.end}
        disabled={state.locked}
        onAction={(action) => (state.last = action.value)}
      >
        <MText>Design review</MText>
      </MSwipeActions>
      <MRow gap="sm">
        <MButton text="Show start" onClick={() => (state.side = 'start')} />
        <MButton text="Show end" onClick={() => (state.side = 'end')} />
        <MButton
          text={state.locked ? 'Unlock' : 'Lock'}
          onClick={() => (state.locked = !state.locked)}
        />
      </MRow>
      <MText>{`Side: ${state.side ?? 'closed'}`}</MText>
      <MText>{`Action: ${state.last}`}</MText>
    </MColumn>
  )
}
