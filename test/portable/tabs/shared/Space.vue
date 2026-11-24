<script setup lang="ts">
import { reactive } from 'vue'
import Tally from './Tally.vue'
import type { TabOption } from './types'

const state = reactive({
  active: 'profile' as string | number | undefined,
  box: 'drafts' as string | number | undefined,
  locked: false as boolean,
  asked: 0 as number,
  tabs: [
    { value: 'profile', label: 'Profile', disabled: undefined },
    { value: 'activity', label: 'Activity', disabled: undefined },
    { value: 'billing', label: 'Billing', disabled: undefined },
    { value: 'soon', label: 'Coming soon', disabled: true },
  ] as TabOption[],
  boxes: [
    { value: 'drafts', label: 'Drafts', disabled: undefined },
    { value: 'sent', label: 'Sent', disabled: undefined },
  ] as TabOption[],
  choose(value: string | number): void {
    state.asked = state.asked + 1
    if (value !== 'billing') {
      state.active = value
    }
  },
})
</script>

<template>
  <MColumn gap="none">
    <MText id="intro">Your space</MText>
    <MTabs
      id="space"
      label="Your space"
      :tabs="state.tabs"
      :modelValue="state.active ?? null"
      @update:modelValue="(choice) => ((value) => state.choose(value))(choice)"
      :disabled="state.locked"
    >
      <template #default="{ value }">
        <MColumn id="panel" gap="sm">
          <template v-if="value === 'profile'">
            <MText variant="heading">About you</MText>
            <Tally :name="'visits'" />
          </template>
          <template v-else>
            <MText>{{ `Recent ${value}` }}</MText>
          </template>
        </MColumn>
      </template>
    </MTabs>
    <MText>{{ `Asked ${state.asked}` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton text="Lock" variant="secondary" @click="() => (state.locked = !state.locked)" />
      <MButton text="Clear" variant="secondary" @click="() => (state.active = undefined)" />
      <MButton
        text="Open activity"
        variant="secondary"
        @click="() => (state.active = 'activity')"
      />
    </MRow>
    <MTabs
      label="Mailbox"
      :tabs="state.boxes"
      :modelValue="state.box ?? null"
      @update:modelValue="(choice) => ((value) => (state.box = value))(choice)"
      :keepAlive="true"
    >
      <template #default="{ value }">
        <Tally :name="value" />
      </template>
    </MTabs>
  </MColumn>
</template>
