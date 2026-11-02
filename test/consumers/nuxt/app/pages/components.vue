<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  MScreen,
  MBox,
  MColumn,
  MText,
  MSpan,
  MIcon,
  MSwitch,
  MChip,
  MEmptyState,
  MSegmentedControl,
  MSkeleton,
  MProgress,
  MListItem,
  MSeparator,
  MAvatar,
} from '@getcortexlabs/mavis-web'
const ready = ref(false)
const enabled = ref(true)
const selected = ref(false)
const period = ref<string | number | null>(7)
onMounted(() => {
  ready.value = true
})
</script>

<template>
  <MScreen scroll>
    <MColumn class="notebook" gap="lg" padding="xl" :data-ready="ready">
      <MText as="h1" variant="display">Room to grow.</MText>
      <MText>Build a <MSpan emphasis="strong">steadier rhythm</MSpan>, one day at a time.</MText>
      <MBox padding="md"><MIcon name="heart" label="A little care" /></MBox>
      <MSwitch v-model="enabled" label="Daily reminders" />
      <MChip v-model="selected" selectable label="Creative work" />
      <MSegmentedControl
        v-model="period"
        label="Review period"
        :options="[
          { value: 7, label: 'Week' },
          { value: 30, label: 'Month' },
        ]"
      />
      <MProgress :value="45" label="Weekly intention" />
      <MSkeleton :height="20" :width="180" />
      <MSeparator />
      <MListItem title="Morning pages" description="A little time for yourself." />
      <MAvatar name="Studio" src="/portrait.svg" />
      <MEmptyState title="A fresh page" description="Your next idea starts here." />
    </MColumn>
  </MScreen>
</template>
