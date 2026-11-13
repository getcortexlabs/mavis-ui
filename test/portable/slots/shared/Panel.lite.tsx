export default function Panel(props: {
  name: string
  title: string
  children?: JSX.Element | JSX.Element[]
  slotHeader?: JSX.Element
  slotFooter?: JSX.Element
}) {
  return (
    <MColumn id={props.name} gap="sm" padding="md">
      {props.slotHeader ?? (
        <MText id={`${props.name}-title`} variant="heading">
          {props.title}
        </MText>
      )}
      {props.children}
      {props.slotFooter}
    </MColumn>
  )
}
