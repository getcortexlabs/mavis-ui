import { useStore } from '@builder.io/mitosis'
export default function LocalCount() {
  const state = useStore({ count: 0 })
  return (
    <MColumn gap="xs">
      <MText>{`Local ${state.count}`}</MText>
      <MButton text="Add local" onClick={() => state.count++} />
    </MColumn>
  )
}
