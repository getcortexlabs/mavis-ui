<script setup lang="ts">
import type { ChoiceValue } from '#mavis'
import { ref } from 'vue'
import type { ChoiceOption } from '#mavis'

const plan = ref<ChoiceValue | null>(null)
const billing = ref<ChoiceValue | null>('monthly')
const frozen = ref(false)
const plans: ChoiceOption[] = [
  { value: 'free', label: 'Free', helperText: 'One project' },
  { value: 'team', label: 'Team', helperText: 'Ten projects' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
]
const cycles: ChoiceOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]
const regions: ChoiceOption[] = [
  { value: 'eu', label: 'Europe' },
  { value: 'us', label: 'United States' },
]

// The source keeps the billing cycle while it is frozen.
function bill(next: ChoiceValue) {
  if (!frozen.value) billing.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MRadioGroup
      id="plans"
      v-model="plan"
      label="Plan"
      helper-text="You can change it later"
      :options="plans"
    />
    <MText id="plan-text">Chosen {{ plan ?? 'nothing' }}</MText>
    <m-radio-group
      label="Billing"
      :options="cycles"
      :model-value="billing"
      @update:model-value="bill"
    />
    <MText>Billed {{ billing ?? 'never' }}</MText>
    <MSwitch v-model="frozen" label="Freeze billing" />
    <MRadioGroup
      label="Region"
      :options="regions"
      model-value="eu"
      disabled
      @update:model-value="(value) => (plan = value)"
    />
  </MColumn>
</template>
