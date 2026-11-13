import { Show } from '@builder.io/mitosis'

export default function StayCard(props: {
  title: string
  price: string
  detail?: string
  onPick: () => void
}) {
  return (
    <MCard gap="xs">
      <MText variant="heading">{props.title}</MText>
      <MText>{props.price}</MText>
      <Show when={props.detail !== undefined}>
        <MText tone="muted">{props.detail ?? ''}</MText>
      </Show>
      <MButton onClick={() => props.onPick()} text={`Pick ${props.title}`} />
    </MCard>
  )
}
