import { useStore, For } from '@builder.io/mitosis'
import TagButton from './TagButton.lite'

export default function Card(props: {
  title: string
  tags: string[]
  onPick: (tag: string) => void
}) {
  const state = useStore({
    firstTitle: props.title,
  })
  return (
    <MColumn gap="xs">
      <MText>
        Now {props.title}, first {state.firstTitle}, {props.tags.length} tags
      </MText>
      <For each={props.tags}>
        {(tag, index) => (
          <TagButton key={tag} label={`${index + 1}. ${tag}`} onPress={() => props.onPick(tag)} />
        )}
      </For>
    </MColumn>
  )
}
