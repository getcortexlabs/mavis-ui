<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type {
  RangeValue,
  ChoiceValue,
  DataSort,
  CivilDate,
  DateRange,
} from '@getcortexlabs/mavis-core'
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const range = ref<RangeValue>([20, 80])
const slide = ref<ChoiceValue>('one')
const sort = ref<DataSort | null>(null)
const selected = ref<ChoiceValue[]>([])
const date = ref<CivilDate | DateRange | null>(null)
const rating = ref(3.5)
const tree = ref<ChoiceValue | null>(null)
const expanded = ref<ChoiceValue[]>([])
const items = [
  { id: 'one', name: 'One' },
  { id: 'two', name: 'Two' },
]
</script>
<template>
  <MColumn gap="lg" padding="lg">
    <MText id="discovery-ready" :text="ready ? 'ready' : 'pending'" />
    <MRangeSlider v-model="range" label="Budget" />
    <MText id="discovery-range" :text="range.join(',')" />
    <MDataTable
      :items="items"
      :columns="[{ key: 'name', label: 'Name', sortable: true }]"
      label="People"
      v-model:sort="sort"
      v-model:selected="selected"
      selectable
    />
    <MCarousel v-model="slide" :items="items" label="Stories"
      ><template #default="{ item }"
        ><MCard><MText :text="item.name" /></MCard></template
    ></MCarousel>
    <MCalendar v-model="date" label="Date" initialMonth="2026-11" />
    <MRating v-model="rating" label="Score" :step="0.5" />
    <MTreeView
      v-model="tree"
      v-model:expanded="expanded"
      :nodes="[{ key: 'root', label: 'Root', children: [{ key: 'child', label: 'Child' }] }]"
      label="Files"
    />
    <MText
      id="discovery-state"
      :text="`${slide}|${sort?.direction ?? ''}|${selected.join(',')}|${date ?? ''}|${rating}|${tree ?? ''}`"
    />
  </MColumn>
</template>
