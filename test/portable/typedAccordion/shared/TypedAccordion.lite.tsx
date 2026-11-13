import { useStore } from '@builder.io/mitosis'
export default function TypedAccordion() {
  const state = useStore({
    opened: [] as ChoiceValue[],
    items: [
      { value: 1, title: 'Number header' },
      { value: '1', title: 'Text header' },
      { value: 0, title: 'Zero header' },
    ] as AccordionItem[],
    get summary(): string {
      return `${state.opened.length}: ${state.opened.includes(1) ? 'N' : '-'}${state.opened.includes('1') ? 'S' : '-'}${state.opened.includes(0) ? 'Z' : '-'}`
    },
  })
  return (
    <MColumn gap="md">
      <MAccordion
        label="Typed panels"
        items={state.items}
        value={state.opened}
        onChange={(value) => (state.opened = value)}
        multiple
      >
        {({ item }) => (
          <MText>
            {item.value === 1 ? 'Number body' : item.value === '1' ? 'Text body' : 'Zero body'}
          </MText>
        )}
      </MAccordion>
      <MText>{state.summary}</MText>
    </MColumn>
  )
}
