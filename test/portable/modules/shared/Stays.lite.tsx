import { For, useStore } from '@builder.io/mitosis'
import StayCard from './StayCard.lite'
import { fixed, read, readings, roots, samples, shape, swapped } from './figures'
import { code, detail, kinds, matches, money, stays, summary, total, type Stay } from './stays'
import { initials, slug } from './text'

export default function Stays() {
  const state = useStore({
    nights: 2,
    kind: 'all',
    picked: '',
    extra: [] as Stay[],
    get shown(): Stay[] {
      return [...stays, ...state.extra].filter((stay) => matches(stay, state.kind))
    },
    more() {
      state.nights += 1
    },
    fewer() {
      state.nights = Math.max(1, state.nights - 1)
    },
    add() {
      state.extra.push({
        id: `extra${state.extra.length + 1}`,
        name: 'Garden Room',
        city: 'Olinda',
        nightly: 49.995,
        tags: ['city', 'quiet'],
      })
    },
  })
  return (
    <MColumn gap="md" id="stays">
      <MText variant="title">{summary(state.shown, state.nights)}</MText>
      <MText>
        {kinds.join(' / ')}, showing {state.kind}
      </MText>
      <MRow gap="sm" wrap>
        <MButton onClick={() => state.more()} text="More nights" />
        <MButton onClick={() => state.fewer()} text="Fewer nights" />
        <MButton onClick={() => (state.kind = 'city')} text="City only" />
        <MButton onClick={() => (state.kind = 'all')} text="Everything" />
        <MButton onClick={() => state.add()} text="Add a room" />
      </MRow>
      <For each={state.shown}>
        {(stay, index) => (
          <StayCard
            key={stay.id}
            title={`${code(stay, index)} ${stay.name}`}
            price={money(total(stay, state.nights))}
            detail={detail(stay)}
            onPick={() => (state.picked = stay.name)}
          />
        )}
      </For>
      <StayCard
        title="Your pick"
        price={
          state.picked === '' ? 'Nothing yet' : `${initials(state.picked)} ${slug(state.picked)}`
        }
        onPick={() => (state.picked = '')}
      />
      <MText>{samples.map((value) => fixed(value)).join(' | ')}</MText>
      <MText>{readings.map((text) => read(text)).join(' | ')}</MText>
      <MText>
        {shape('north-east')} {roots([2, 16, 200])} {swapped('banana')}
      </MText>
      <MText>
        {money(
          total(stays[0] ?? { id: '', name: '', city: '', nightly: 0, tags: [] }, state.nights, 10),
        )}
      </MText>
    </MColumn>
  )
}
