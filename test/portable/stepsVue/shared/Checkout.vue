<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue, StepOption } from '@getcortexlabs/mavis-core'

const current = ref<ChoiceValue | null>('cart')
const failed = ref(false)
const unlocked = ref(false)
const busy = ref(false)
const asked = ref(0)
const steps = computed<StepOption[]>(() => [
  { value: 'cart', label: 'Cart', status: 'complete' },
  { value: 'address', label: 'Address', status: failed.value ? 'error' : 'pending' },
  { value: 'payment', label: 'Payment', disabled: !unlocked.value },
  { value: 'review', label: 'Review' },
])

// The source keeps the review closed.
function go(value: ChoiceValue) {
  asked.value = asked.value + 1
  if (value !== 'review') current.value = value
}
</script>

<template>
  <MColumn gap="md">
    <MColumn id="flow">
      <MSteps
        label="Checkout"
        :steps="steps"
        :model-value="current"
        :loading="busy"
        @update:model-value="go"
      />
    </MColumn>
    <MText id="summary">Step {{ current ?? 'none' }}, asked {{ asked }}</MText>
    <MRow gap="sm" wrap>
      <MButton variant="ghost" @click="failed = !failed">Fail address</MButton>
      <MButton variant="ghost" @click="unlocked = true">Unlock payment</MButton>
      <MButton variant="ghost" @click="busy = !busy">Busy</MButton>
      <MButton variant="ghost" @click="current = null">Leave</MButton>
    </MRow>
  </MColumn>
</template>
