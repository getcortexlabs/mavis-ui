import { useStore, Show } from '@builder.io/mitosis'
type Place = { id: string; name: string }
export default function GuardedRecord() {
  const state = useStore({
    places: [{ id: 'one', name: 'İSTANBUL' }] as Place[],
    visible: true,
    get place() {
      return state.places.find((item) => item.id === (state.visible ? 'one' : 'missing'))
    },
    toggle() {
      state.visible = !state.visible
    },
  })
  return (
    <MColumn>
      <Show when={state.place !== undefined} else={<MText>Missing</MText>}>
        <MText>{state.place!.name}</MText>
        <MText>{state.place!.name.toLocaleLowerCase('tr')}</MText>
        <MText>{'I'.toLocaleLowerCase('tr')}</MText>
      </Show>
      <MButton text="Toggle place" onClick={() => state.toggle()} />
    </MColumn>
  )
}
