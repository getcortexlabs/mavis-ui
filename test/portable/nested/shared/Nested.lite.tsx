import { useStore } from '@builder.io/mitosis'
import type { Profile } from './types'
import Card from './Card.lite'

export default function Nested() {
  const state = useStore({
    profile: {
      name: 'Lin',
      tags: ['calm', 'bold'],
      address: { city: 'Recife', zip: '50000' },
    } as Profile,
    picked: 'none',
    rename() {
      state.profile.name = state.profile.name + '!'
    },
    move() {
      state.profile.address.city = 'Lisboa'
      state.profile.address = { ...state.profile.address, zip: '1100' }
    },
    tag() {
      state.profile.tags.push(`tag${state.profile.tags.length}`)
    },
    pick(tag: string) {
      state.picked = tag
    },
  })
  return (
    <MColumn gap="sm">
      <MText>
        {state.profile.name} in {state.profile.address.city} {state.profile.address.zip}; picked{' '}
        {state.picked}
      </MText>
      <Card
        title={state.profile.name}
        tags={state.profile.tags}
        onPick={(tag) => state.pick(tag)}
      />
      <MColumn gap="xs">
        <MButton text="Rename" onClick={() => state.rename()} />
        <MButton text="Move" onClick={() => state.move()} />
        <MButton text="Tag" onClick={() => state.tag()} />
      </MColumn>
    </MColumn>
  )
}
