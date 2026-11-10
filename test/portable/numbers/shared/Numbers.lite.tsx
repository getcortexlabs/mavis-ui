import { useStore } from '@builder.io/mitosis'

export default function Numbers() {
  const state = useStore({
    value: 0,
    get label(): string {
      return `Value: ${state.value}`
    },
    get rounded(): number {
      return Math.round(state.value * 10) / 10
    },
    add(amount: number) {
      state.value += amount
    },
  })
  return (
    <MColumn gap="sm">
      <MText>{state.label}</MText>
      <MText>Rounded {state.rounded}</MText>
      <MText>{state.value % 3}</MText>
      <MText>
        {Math.floor(state.value / 3)} and {Math.max(state.value, 2.5)}
      </MText>
      <MColumn gap="xs">
        <MButton text="Add tenth" onClick={() => state.add(0.1)} />
        <MButton text="Add two tenths" onClick={() => state.add(0.2)} />
        <MButton text="Negative half" onClick={() => (state.value = -2.5)} />
        <MButton text="Huge" onClick={() => (state.value = 1e21)} />
        <MButton text="Tiny" onClick={() => (state.value = 0.0000001)} />
        <MButton text="Divide" onClick={() => (state.value = state.value / 3)} />
        <MButton text="Precise" onClick={() => (state.value = 123456789.125)} />
        <MButton text="Micro" onClick={() => (state.value = 0.000001)} />
      </MColumn>
    </MColumn>
  )
}
