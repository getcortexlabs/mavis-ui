<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MInput, MCheckbox, MRadioGroup, MSlider } from '@getcortexlabs/mavis-web'
const ready = ref(false)
const attempts = ref(0)
const composing = ref('')
const submits = ref(0)
const untouched = ref('Untouched')
onMounted(() => {
  ready.value = true
})
</script>

<template>
  <main :data-ready="ready">
    <h1>Controlled editors</h1>
    <MInput label="Owned text" modelValue="Parent" @update:modelValue="attempts++" />
    <MCheckbox label="Owned checkbox" :modelValue="false" @update:modelValue="attempts++" />
    <MRadioGroup
      label="Owned radio"
      :modelValue="null"
      :options="[
        { value: 0, label: 'Zero' },
        { value: 'one', label: 'One' },
      ]"
      @update:modelValue="attempts++"
    />
    <MSlider
      label="Owned range"
      :modelValue="5"
      :min="0"
      :max="10"
      @update:modelValue="attempts++"
    />
    <MInput label="Read only" modelValue="Locked" readonly />
    <MInput label="Disabled" modelValue="Disabled" disabled />
    <MInput label="Untouched" v-model="untouched" @update:modelValue="attempts++" />
    <MInput label="Composition" v-model="composing" @submit="submits++" />
    <output data-testid="attempts">{{ attempts }}</output>
    <output data-testid="composition">{{ composing }}</output>
    <output data-testid="submits">{{ submits }}</output>
  </main>
</template>
