import { useStore } from '@builder.io/mitosis'
import type { Story } from './types'

export default function Stories() {
  const state = useStore({
    current: undefined as string | undefined,
    looping: false,
    locked: false,
    stories: [
      { id: 'walk', title: 'A walk before breakfast', note: 'The street is still asleep.' },
      { id: 'market', title: 'Saturday market', note: 'Peaches, bread and a long chat.' },
      { id: 'ferry', title: 'The last ferry', note: 'Lights on the water, all the way back.' },
    ] as Story[],
    clear() {
      state.stories = []
    },
  })

  return (
    <MColumn gap="md" width={360}>
      <MCarousel
        id="stories"
        label="Stories"
        items={state.stories}
        value={state.current}
        onChange={(value) => (state.current = value)}
        loop={state.looping}
        disabled={state.locked}
        slotEmpty={<MText>Nothing to read yet</MText>}
      >
        {({ item, index }) => (
          <MColumn id="slide" padding="lg" gap="sm" backgroundColor="#F4E9FF">
            <MText variant="heading">{item.title}</MText>
            <MText>{item.note}</MText>
            <MText tone="muted">Story {index + 1}</MText>
          </MColumn>
        )}
      </MCarousel>
      <MText>Current: {state.current ?? 'none'}</MText>
      <MRow gap="sm" wrap>
        <MButton text="Loop" onClick={() => (state.looping = !state.looping)} />
        <MButton text="Lock" onClick={() => (state.locked = !state.locked)} />
        <MButton text="Clear" onClick={() => state.clear()} />
      </MRow>
    </MColumn>
  )
}
