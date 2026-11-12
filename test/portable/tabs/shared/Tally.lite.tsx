import { useStore } from '@builder.io/mitosis'

export default function Tally(props: { name: string }) {
  const state = useStore({
    count: 0,
  })

  return (
    <MRow gap="sm">
      <MText>{`${props.name} ${state.count}`}</MText>
      <MButton
        text={`Add to ${props.name}`}
        variant="secondary"
        size="sm"
        onClick={() => (state.count = state.count + 1)}
      />
    </MRow>
  )
}
