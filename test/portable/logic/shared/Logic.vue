<script setup lang="ts">
import { reactive } from 'vue'
import type { Person } from './types'

const state = reactive({
  log: '' as string,
  picked: undefined as string | undefined,
  owner: undefined as Person | undefined,
  count: 0 as number,
  get pickedLabel(): string {
    return state.picked ?? 'nothing'
  },
  get ownerName(): string {
    return state.owner?.name ?? 'nobody'
  },
  get ownerAge(): number {
    return state.owner?.age ?? -1
  },
  note(text: string): void {
    state.log += text
  },
  pick(name: string): void {
    if (name === '') {
      state.note('empty;')
      return
    }
    if (state.picked === name) {
      state.note('same;')
    } else if (state.picked === undefined) {
      state.note('first;')
    } else {
      state.note('swap;')
    }
    state.picked = name
    state.count += 2
    state.count -= 1
  },
  adopt(): void {
    const current = state.owner
    if (current !== undefined) {
      state.owner = { ...current, age: current.age + 1 }
    } else {
      state.owner = { name: `Ada ${state.count}`, age: 36 }
    }
  },
  clear(): void {
    state.picked = undefined
    state.owner = undefined
    state.log = ''
    state.count = 0
  },
})
</script>

<template>
  <MColumn gap="sm">
    <MText>{{ `Picked ${state.pickedLabel}; count ${state.count}` }}</MText>
    <MText>{{ `Owner ${state.ownerName} (${state.ownerAge})` }}</MText>
    <MText>{{ `Log [${state.log}]` }}</MText>
    <MColumn gap="xs">
      <MButton text="Pick Ada" @click="() => state.pick('Ada')" />
      <MButton text="Pick Bo" @click="() => state.pick('Bo')" />
      <MButton text="Pick nobody" @click="() => state.pick('')" />
      <MButton text="Adopt" @click="() => state.adopt()" />
      <MButton text="Clear" variant="secondary" @click="() => state.clear()" />
    </MColumn>
  </MColumn>
</template>
