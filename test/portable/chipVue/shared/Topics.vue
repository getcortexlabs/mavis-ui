<script setup lang="ts">
import { ref } from 'vue'
import { MChip, MColumn, MRow, MText } from '#mavis'

const design = ref(true)
const motion = ref(false)
const pinned = ref(true)
const locked = ref(true)
</script>

<template>
  <MColumn id="page" gap="md" :width="360">
    <MText
      >{{ design ? 'Design' : 'No design' }}, {{ motion ? 'motion' : 'no motion' }},
      {{ locked ? 'locked' : 'open' }}</MText
    >
    <MRow id="topics" gap="sm">
      <MChip id="design" label="Design" selectable v-model="design" />
      <m-chip
        id="motion"
        label="Motion"
        icon="sparkles"
        tone="accent"
        selectable
        :modelValue="motion"
        @update:modelValue="(value) => (motion = value)"
      />
      <MChip id="plain" label="Read only" icon="lock" />
    </MRow>
    <MChip
      v-if="pinned"
      id="pinned"
      label="Pinned"
      removable
      removeLabel="Unpin"
      @remove="pinned = false"
    />
    <MChip
      id="locked"
      label="Locked"
      selectable
      v-model="locked"
      removable
      removeLabel="Remove Locked"
      @remove="locked = false"
      disabled
    />
    <MChip id="wide" label="On" selectable v-model="design" :width="200" />
    <MColumn id="narrow" :width="140">
      <MChip id="long" label="A label that does not fit" />
    </MColumn>
  </MColumn>
</template>
