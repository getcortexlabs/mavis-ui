import { useStore } from '@builder.io/mitosis'
import Quantity from './Quantity.lite'
export default function ControlPanel() {
  const state = useStore({ count: 1, unit: 'kg', last: 'none' })
  return (
    <MColumn gap="md">
      <Quantity
        modelValue={state.count}
        onUpdateModelValue={(value) => {
          state.count = value
          state.last = `Changed to ${value}`
        }}
        unit={state.unit}
        onUpdateUnit={(value) => (state.unit = value)}
      />
      <MText>{`Total: ${state.count} ${state.unit}`}</MText>
      <MText>{state.last}</MText>
      <MButton
        text="Reset"
        onClick={() => {
          state.count = 1
          state.unit = 'kg'
        }}
      />
    </MColumn>
  )
}
