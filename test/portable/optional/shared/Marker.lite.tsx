import { Show } from '@builder.io/mitosis'

export default function Marker(props: {
  label: string
  strong?: boolean
  count?: number
  onTap?: (label: string) => void
}) {
  return (
    <MRow gap="sm">
      <MText weight={(props.strong ?? false) ? 'bold' : 'normal'}>
        {props.label} {props.count ?? 0}
      </MText>
      <Show when={props.strong === undefined}>
        <MText tone="muted">plain</MText>
      </Show>
      <MButton onClick={() => props.onTap?.(props.label)} text={`Tap ${props.label}`} />
    </MRow>
  )
}
