import { useStore } from '@builder.io/mitosis'
import type { Person } from './types'

export default function Logic() {
  const state = useStore({
    log: '',
    picked: undefined as string | undefined,
    owner: undefined as Person | undefined,
    count: 0,
    get pickedLabel(): string {
      return state.picked ?? 'nothing'
    },
    get ownerName(): string {
      return state.owner?.name ?? 'nobody'
    },
    get ownerAge(): number {
      return state.owner?.age ?? -1
    },
    note(text: string) {
      state.log += text
    },
    pick(name: string) {
      if (name === '') {
        state.note('empty;')
        return
      }
      if (state.picked === name) state.note('same;')
      else if (state.picked === undefined) state.note('first;')
      else state.note('swap;')
      state.picked = name
      state.count += 2
      state.count -= 1
    },
    adopt() {
      const current = state.owner
      if (current !== undefined) {
        state.owner = { ...current, age: current.age + 1 }
      } else {
        state.owner = { name: `Ada ${state.count}`, age: 36 }
      }
    },
    clear() {
      state.picked = undefined
      state.owner = undefined
      state.log = ''
      state.count = 0
    },
  })
  return (
    <MColumn gap="sm">
      <MText>
        Picked {state.pickedLabel}; count {state.count}
      </MText>
      <MText>
        Owner {state.ownerName} ({state.ownerAge})
      </MText>
      <MText>Log [{state.log}]</MText>
      <MColumn gap="xs">
        <MButton text="Pick Ada" onClick={() => state.pick('Ada')} />
        <MButton text="Pick Bo" onClick={() => state.pick('Bo')} />
        <MButton text="Pick nobody" onClick={() => state.pick('')} />
        <MButton text="Adopt" onClick={() => state.adopt()} />
        <MButton text="Clear" variant="secondary" onClick={() => state.clear()} />
      </MColumn>
    </MColumn>
  )
}
