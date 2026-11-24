<script setup lang="ts">
import { reactive } from 'vue'
import StayCard from './StayCard.vue'
import type { Stay } from './types'
import * as mavisFigures from './shared/figures'
import * as mavisStays from './shared/stays'
import * as mavisText from './shared/text'
import { vMavisKeepFocus } from './runtime'

const state = reactive({
  nights: 2 as number,
  kind: 'all' as string,
  picked: '' as string,
  extra: [] as Stay[],
  get shown(): Stay[] {
    return [...mavisStays.stays, ...state.extra].filter((stay) =>
      mavisStays.matches(stay, state.kind),
    )
  },
  more(): void {
    state.nights += 1
  },
  fewer(): void {
    state.nights = Math.max(1, state.nights - 1)
  },
  add(): void {
    state.extra.push({
      id: `extra${state.extra.length + 1}`,
      name: 'Garden Room',
      city: 'Olinda',
      nightly: 49.995,
      tags: ['city', 'quiet'],
      note: undefined,
    })
  },
})
</script>

<template>
  <MColumn gap="md" id="stays" v-mavis-keep-focus>
    <MText variant="title">{{ mavisStays.summary(state.shown, state.nights) }}</MText>
    <MText>{{ `${mavisStays.kinds.join(' / ')}, showing ${state.kind}` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton @click="() => state.more()" text="More nights" />
      <MButton @click="() => state.fewer()" text="Fewer nights" />
      <MButton @click="() => (state.kind = 'city')" text="City only" />
      <MButton @click="() => (state.kind = 'all')" text="Everything" />
      <MButton @click="() => state.add()" text="Add a room" />
    </MRow>
    <template v-for="(stay, index) in state.shown" :key="stay.id">
      <StayCard
        :title="`${mavisStays.code(stay, index)} ${stay.name}`"
        :price="mavisStays.money(mavisStays.total(stay, state.nights, undefined))"
        :detail="mavisStays.detail(stay)"
        :onPick="() => (state.picked = stay.name)"
      />
    </template>
    <StayCard
      :title="'Your pick'"
      :price="
        state.picked === ''
          ? 'Nothing yet'
          : `${mavisText.initials(state.picked)} ${mavisText.slug(state.picked)}`
      "
      :onPick="() => (state.picked = '')"
    />
    <MText>{{ mavisFigures.samples.map((value) => mavisFigures.fixed(value)).join(' | ') }}</MText>
    <MText>{{ mavisFigures.readings.map((text) => mavisFigures.read(text)).join(' | ') }}</MText>
    <MText>{{
      `${mavisFigures.shape('north-east')} ${mavisFigures.roots([2, 16, 200])} ${mavisFigures.swapped('banana')}`
    }}</MText>
    <MText>{{
      mavisStays.money(
        mavisStays.total(
          mavisStays.stays[0] ?? {
            id: '',
            name: '',
            city: '',
            nightly: 0,
            tags: [],
            note: undefined,
          },
          state.nights,
          10,
        ),
      )
    }}</MText>
  </MColumn>
</template>
