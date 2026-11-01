<script setup lang="ts">
import { computed, ref } from 'vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { theme, setTheme } = useMavisTheme()
const password = ref('mavis-password')
const visible = ref(false)
const disabled = ref(false)
const readonly = ref(false)
const actionDisabled = ref(false)
const actions = ref(0)
const focused = ref(false)
const bio = ref('A short note')
const choice = ref(false)
const selected = ref<string | number | null>('night')
const long = ref(false)
const label = computed(() =>
  long.value ? 'Receber notificações importantes durante a noite' : 'Noite',
)
const options = computed(() => [
  { value: 'night', label: label.value },
  { value: 'day', label: 'Dia' },
])
const open = ref(false)
const title = ref('   ')
const sheetLabel = ref('Account actions')
function useSheetLabel() {
  title.value = ''
  sheetLabel.value = 'Updated label'
}
function togglePassword() {
  visible.value = !visible.value
  actions.value++
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-text variant="title">Consumer checks</m-text>
      <m-input
        id="action-password"
        v-model="password"
        label="Action password"
        :type="visible ? 'text' : 'password'"
        :disabled="disabled"
        :readonly="readonly"
        autocapitalize="none"
        :autocorrect="false"
        icon="lock"
        helperText="Keep editing after revealing the password."
        :trailingAction="{
          icon: visible ? 'eye-off' : 'eye',
          label: visible ? 'Hide check password' : 'Show check password',
          disabled: actionDisabled,
        }"
        @action="togglePassword"
        @focus="focused = true"
        @blur="focused = false"
      />
      <m-text id="action-state"
        >{{ password }} · {{ actions }} actions · {{ focused ? 'focused' : 'blurred' }}</m-text
      >
      <m-row gap="sm" wrap>
        <m-button @click="disabled = !disabled">Toggle input disabled</m-button>
        <m-button @click="readonly = !readonly">Toggle input readonly</m-button>
        <m-button @click="actionDisabled = !actionDisabled">Toggle action disabled</m-button>
      </m-row>
      <m-input
        v-model="bio"
        label="Action multiline"
        multiline
        :rows="1"
        error="Review this note"
        :trailingAction="{
          icon: 'x',
          label: 'Clear the entire note without changing the password',
        }"
        @action="bio = ''"
      />
      <m-button @click="setTheme(theme.appearance === 'light' ? midnight : mavis)"
        >Change check theme</m-button
      >
      <m-row id="choice-header" gap="md" wrap align="center">
        <m-text variant="heading" :grow="1">Minha conta</m-text>
        <m-switch v-model="choice" label="Noite" :shrink="0" />
      </m-row>
      <m-column id="constrained-choices" :width="100" gap="md">
        <m-switch v-model="choice" :label="label" />
        <m-checkbox v-model="choice" :label="label" />
        <m-radio-group v-model="selected" label="Period" :options="options" />
        <m-select v-model="selected" label="Preference" :options="options" />
      </m-column>
      <m-button @click="long = !long">Toggle long labels</m-button>
      <m-button @click="open = true">Open named sheet</m-button>
      <m-sheet v-model:open="open" :title="title" :accessibilityLabel="sheetLabel">
        <m-text>Named even without a heading.</m-text>
        <m-button @click="title = 'Updated heading'">Add sheet heading</m-button>
        <m-button @click="useSheetLabel">Use sheet label</m-button>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
