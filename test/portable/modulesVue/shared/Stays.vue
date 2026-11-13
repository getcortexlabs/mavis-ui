<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MRow, MText } from '#mavis'
import StayCard from './StayCard.vue'
import { fixed, read, readings, roots, samples, shape, swapped } from './figures'
import { code, detail, kinds, matches, money, stays, summary, total, type Stay } from './stays'
import { initials, slug } from './text'

const nights = ref(2)
const kind = ref('all')
const picked = ref('')
const extra = ref<Stay[]>([])
const shown = computed(() => [...stays, ...extra.value].filter((stay) => matches(stay, kind.value)))

function more() {
  nights.value += 1
}
function fewer() {
  nights.value = Math.max(1, nights.value - 1)
}
function add() {
  extra.value.push({
    id: `extra${extra.value.length + 1}`,
    name: 'Garden Room',
    city: 'Olinda',
    nightly: 49.995,
    tags: ['city', 'quiet'],
  })
}
</script>

<template>
  <MColumn gap="md" id="stays">
    <MText variant="title">{{ summary(shown, nights) }}</MText>
    <MText>{{ kinds.join(' / ') }}, showing {{ kind }}</MText>
    <MRow gap="sm" wrap>
      <MButton @click="more">More nights</MButton>
      <MButton @click="fewer">Fewer nights</MButton>
      <MButton @click="kind = 'city'">City only</MButton>
      <MButton @click="kind = 'all'">Everything</MButton>
      <MButton @click="add">Add a room</MButton>
    </MRow>
    <StayCard
      v-for="(stay, index) in shown"
      :key="stay.id"
      :title="`${code(stay, index)} ${stay.name}`"
      :price="money(total(stay, nights))"
      :detail="detail(stay)"
      @pick="picked = stay.name"
    />
    <StayCard
      title="Your pick"
      :price="picked === '' ? 'Nothing yet' : `${initials(picked)} ${slug(picked)}`"
      @pick="picked = ''"
    />
    <MText>{{ samples.map((value) => fixed(value)).join(' | ') }}</MText>
    <MText>{{ readings.map((text) => read(text)).join(' | ') }}</MText>
    <MText>{{ shape('north-east') }} {{ roots([2, 16, 200]) }} {{ swapped('banana') }}</MText>
    <MText>{{
      money(total(stays[0] ?? { id: '', name: '', city: '', nightly: 0, tags: [] }, nights, 10))
    }}</MText>
  </MColumn>
</template>
