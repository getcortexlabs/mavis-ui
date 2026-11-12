import { useStore } from '@builder.io/mitosis'
import type { Topic } from './types'

export default function Faq() {
  const state = useStore({
    questions: [
      {
        value: 'delivery',
        title: 'When will it arrive?',
        description: 'Shipping and tracking',
        icon: 'package',
      },
      { value: 'returns', title: 'Can I send it back?' },
      { value: 'gift', title: 'Gift wrapping', disabled: true },
    ] as AccordionItem[],
    open: ['delivery'],
    topics: [
      { value: 'first', title: 'First topic' },
      { value: 'second', title: 'Second topic' },
    ] as Topic[],
    several: [] as string[],
    frozen: false,
    asked: 0,
  })

  return (
    <MColumn gap="lg">
      <MAccordion
        id="single"
        label="Order questions"
        items={state.questions}
        value={state.open}
        onChange={(value) => (state.open = value)}
      >
        {({ item }) => (
          <MColumn id={`answer-${item.value}`} gap="sm">
            <MText>
              {item.value === 'delivery' ? 'Check the date in your order.' : 'Within thirty days.'}
            </MText>
            <MColumn id={`swatch-${item.value}`} height={48} />
            <MButton
              text={`Ask about ${item.value}`}
              variant="secondary"
              onClick={() => (state.asked += 1)}
            />
          </MColumn>
        )}
      </MAccordion>
      <MText>{`Open: ${state.open.join(', ')}. Asked ${state.asked} times.`}</MText>
      <MAccordion
        label="Several at once"
        items={state.topics}
        value={state.several}
        onChange={(next) => (state.several = next)}
        multiple
        disabled={state.frozen}
        expandedLabel="Open"
        collapsedLabel="Closed"
      >
        {({ item }) => <MText>{`About the ${item.title.toLowerCase()}`}</MText>}
      </MAccordion>
      <MRow gap="sm">
        <MButton
          text={state.frozen ? 'Thaw' : 'Freeze'}
          onClick={() => (state.frozen = !state.frozen)}
        />
        <MText>{`${state.several.length} open below`}</MText>
      </MRow>
    </MColumn>
  )
}
