<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  plan: undefined as string | number | undefined,
  billing: 'monthly' as string | number | undefined,
  frozen: false as boolean,
  plans: [
    { value: 'free', label: 'Free', helperText: 'One project', disabled: undefined },
    { value: 'team', label: 'Team', helperText: 'Ten projects', disabled: undefined },
    { value: 'enterprise', label: 'Enterprise', disabled: true, helperText: undefined },
  ] as SelectOption[],
  cycles: [
    { value: 'monthly', label: 'Monthly', helperText: undefined, disabled: undefined },
    { value: 'yearly', label: 'Yearly', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  regions: [
    { value: 'eu', label: 'Europe', helperText: undefined, disabled: undefined },
    { value: 'us', label: 'United States', helperText: undefined, disabled: undefined },
  ] as SelectOption[],
  bill(next: string | number): void {
    if (!state.frozen) {
      state.billing = next
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MRadioGroup
      id="plans"
      label="Plan"
      helperText="You can change it later"
      :options="state.plans"
      :modelValue="state.plan ?? null"
      @update:modelValue="(choice) => ((value) => (state.plan = value))(choice)"
    />
    <MText id="plan-text">{{ `Chosen ${state.plan ?? 'nothing'}` }}</MText>
    <MRadioGroup
      label="Billing"
      :options="state.cycles"
      :modelValue="state.billing ?? null"
      @update:modelValue="(choice) => ((next) => state.bill(next))(choice)"
    />
    <MText>{{ `Billed ${state.billing ?? 'never'}` }}</MText>
    <MSwitch
      label="Freeze billing"
      :modelValue="state.frozen"
      @update:modelValue="(value) => (state.frozen = value)"
    />
    <MRadioGroup
      label="Region"
      :options="state.regions"
      :modelValue="'eu' ?? null"
      @update:modelValue="(choice) => ((value) => (state.plan = value))(choice)"
      :disabled="true"
    />
  </MColumn>
</template>
