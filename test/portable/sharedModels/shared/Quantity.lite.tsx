type Props = {
  modelValue: number
  unit: string
  onUpdateModelValue: (value: number) => void
  onUpdateUnit: (value: string) => void
}
export default function Quantity(props: Props) {
  return (
    <MColumn gap="sm">
      <MText>{`Quantity: ${props.modelValue} ${props.unit}`}</MText>
      <MButton text="Add one" onClick={() => props.onUpdateModelValue(props.modelValue + 1)} />
      <MButton
        text="Change unit"
        onClick={() => props.onUpdateUnit(props.unit === 'kg' ? 'lb' : 'kg')}
      />
    </MColumn>
  )
}
