<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  design: true as boolean,
  motion: false as boolean,
  pinned: true as boolean,
  locked: true as boolean,
})
</script>

<template>
  <MColumn id="page" gap="md" :width="360">
    <MText>{{
      `${state.design ? 'Design' : 'No design'}, ${state.motion ? 'motion' : 'no motion'}, ${state.locked ? 'locked' : 'open'}`
    }}</MText>
    <MRow id="topics" gap="sm">
      <MChip
        id="design"
        label="Design"
        :selectable="true"
        :modelValue="state.design"
        @update:modelValue="(value) => (state.design = value)"
      />
      <MChip
        id="motion"
        label="Motion"
        icon="sparkles"
        tone="accent"
        :selectable="true"
        :modelValue="state.motion"
        @update:modelValue="(value) => (state.motion = value)"
      />
      <MChip id="plain" label="Read only" icon="lock" />
    </MRow>
    <template v-if="state.pinned">
      <MChip
        id="pinned"
        label="Pinned"
        :removable="true"
        removeLabel="Unpin"
        @remove="() => (state.pinned = false)"
      />
    </template>
    <MChip
      id="locked"
      label="Locked"
      :selectable="true"
      :modelValue="state.locked"
      @update:modelValue="(value) => (state.locked = value)"
      :removable="true"
      removeLabel="Remove Locked"
      @remove="() => (state.locked = false)"
      :disabled="true"
    />
    <MChip
      id="wide"
      label="On"
      :selectable="true"
      :modelValue="state.design"
      @update:modelValue="(value) => (state.design = value)"
      :width="200"
    />
    <MColumn id="narrow" :width="140">
      <MChip id="long" label="A label that does not fit" />
    </MColumn>
  </MColumn>
</template>
