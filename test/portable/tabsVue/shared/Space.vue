<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue, TabOption } from '@getcortexlabs/mavis-core'
import Tally from './Tally.vue'

const active = ref<ChoiceValue | null>('profile')
const box = ref<ChoiceValue | null>('drafts')
const locked = ref(false)
const asked = ref(0)
const tabs: TabOption[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'activity', label: 'Activity' },
  { value: 'billing', label: 'Billing' },
  { value: 'soon', label: 'Coming soon', disabled: true },
]
const boxes: TabOption[] = [
  { value: 'drafts', label: 'Drafts' },
  { value: 'sent', label: 'Sent' },
]

// The source keeps billing closed.
function choose(value: ChoiceValue) {
  asked.value = asked.value + 1
  if (value !== 'billing') active.value = value
}
</script>

<template>
  <MColumn gap="none">
    <MText id="intro">Your space</MText>
    <MTabs
      id="space"
      label="Your space"
      :tabs="tabs"
      :model-value="active"
      :disabled="locked"
      @update:model-value="choose"
    >
      <template #default="{ value }">
        <MColumn id="panel" gap="sm">
          <template v-if="value === 'profile'">
            <MText variant="heading">About you</MText>
            <Tally name="visits" />
          </template>
          <MText v-else>Recent {{ value }}</MText>
        </MColumn>
      </template>
    </MTabs>
    <MText>Asked {{ asked }}</MText>
    <MRow gap="sm" wrap>
      <MButton variant="secondary" @click="locked = !locked">Lock</MButton>
      <MButton variant="secondary" @click="active = null">Clear</MButton>
      <MButton variant="secondary" @click="active = 'activity'">Open activity</MButton>
    </MRow>
    <m-tabs v-model="box" label="Mailbox" :tabs="boxes" keep-alive v-slot="{ value }">
      <Tally :name="value" />
    </m-tabs>
  </MColumn>
</template>
