import { useStore } from '@builder.io/mitosis'
import Marker from './Marker.lite'

export default function Optional(props: { title?: string; onDone?: () => void }) {
  const state = useStore({
    last: 'none',
    taps: 0,
    tap(label: string) {
      state.last = label
      state.taps += 1
      props.onDone?.()
    },
  })
  return (
    <MColumn gap="md">
      <MText variant="title">{props.title ?? 'Untitled'}</MText>
      <Marker
        label="First"
        strong={state.taps > 1}
        count={state.taps}
        onTap={(label) => state.tap(label)}
      />
      <Marker label="Second" strong={false} />
      <Marker label="Third" onTap={(label) => state.tap(label)} />
      <MText>
        Last {state.last}, {state.taps}
      </MText>
    </MColumn>
  )
}
