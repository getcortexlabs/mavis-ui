export default function TagButton(props: { label: string; onPress: () => void }) {
  return <MButton text={props.label} variant="secondary" onClick={() => props.onPress()} />
}
