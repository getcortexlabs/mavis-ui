<script setup lang="ts">
import { reactive } from 'vue'
import type { StepOption } from './types'

const state = reactive({
  current: 'cart' as string | number | undefined,
  failed: false as boolean,
  unlocked: false as boolean,
  busy: false as boolean,
  asked: 0 as number,
  get steps(): StepOption[] {
    return [
      {
        value: 'cart',
        label: 'Cart',
        status: 'complete',
        helperText: undefined,
        disabled: undefined,
      },
      {
        value: 'address',
        label: 'Address',
        status: state.failed ? 'error' : 'pending',
        helperText: undefined,
        disabled: undefined,
      },
      {
        value: 'payment',
        label: 'Payment',
        disabled: !state.unlocked,
        helperText: undefined,
        status: undefined,
      },
      {
        value: 'review',
        label: 'Review',
        helperText: undefined,
        disabled: undefined,
        status: undefined,
      },
    ]
  },
  go(value: string | number): void {
    state.asked = state.asked + 1
    if (value !== 'review') {
      state.current = value
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MColumn id="flow">
      <MSteps
        label="Checkout"
        :steps="state.steps"
        :modelValue="state.current ?? null"
        @update:modelValue="(choice) => ((value) => state.go(value))(choice)"
        :loading="state.busy"
      />
    </MColumn>
    <MText id="summary">{{ `Step ${state.current ?? 'none'}, asked ${state.asked}` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton text="Fail address" variant="ghost" @click="() => (state.failed = !state.failed)" />
      <MButton text="Unlock payment" variant="ghost" @click="() => (state.unlocked = true)" />
      <MButton text="Busy" variant="ghost" @click="() => (state.busy = !state.busy)" />
      <MButton text="Leave" variant="ghost" @click="() => (state.current = undefined)" />
    </MRow>
  </MColumn>
</template>
