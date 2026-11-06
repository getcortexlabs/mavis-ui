<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const ready = ref(false),
  color = ref('#12345680'),
  card = ref<ChoiceValue | null>('a'),
  step = ref<string | null>(null),
  selected = ref<ChoiceValue[]>([1]),
  value = ref(72),
  paused = ref(false)
onMounted(() => {
  ready.value = true
})
</script>
<template>
  <MColumn gap="lg" padding="lg">
    <MText id="creative-ready" :text="ready ? 'ready' : 'pending'" />
    <MColorPicker v-model="color" label="Signature color" alpha />
    <MSwipeDeck
      v-model="card"
      label="Discover"
      :items="[
        { id: 'a', title: 'A retained card' },
        { id: 'b', title: 'Another story' },
      ]"
    />
    <MGauge :value="value" label="Balance" suffix="%" /><MButton
      text="Update meter"
      @click="value = 92"
    />
    <MButton text="Start tour" @click="step = 'name'" />
    <MTour
      v-model="step"
      label="Welcome"
      :steps="[{ id: 'name', title: 'Your story', description: 'Give it a name.' }]"
      ><MTourTarget name="name"><MText text="A retained target" /></MTourTarget
    ></MTour>
    <MTransferList
      v-model="selected"
      label="Kit"
      :options="[
        { value: 1, label: 'Camera' },
        { value: 2, label: 'Notebook' },
      ]"
    />
    <MMarquee
      v-model:paused="paused"
      label="Reminders"
      :items="[{ id: 'a', label: 'Stay curious' }]"
    />
    <MText id="creative-state" :text="`${color}|${card}|${selected.join(',')}`" />
  </MColumn>
</template>
