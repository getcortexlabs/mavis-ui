<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue, TabOption } from '@getcortexlabs/mavis-core'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'
import CachedPanelCheck from '../demos/CachedPanelCheck.vue'
const { navigation } = useCatalog()
const value = ref<ChoiceValue | null>(0),
  changes = ref(0),
  reject = ref(false),
  disabled = ref(false),
  removed = ref(false),
  empty = ref(false),
  mounted = ref(true)
const draft = ref('Kept outside the panel')
const keepAlive = ref(false)
const tabs = computed<TabOption[]>(() =>
  empty.value
    ? []
    : [
        { value: 0, label: 'Number zero' },
        { value: '0', label: 'String zero' },
        { value: 'blocked', label: 'Unavailable', disabled: true },
        { value: 'long', label: 'An intentionally long tab label for a narrow screen' },
        ...(!removed.value ? [{ value: 'last', label: 'Last tab' }] : []),
      ],
)
function update(next: ChoiceValue) {
  changes.value++
  if (!reject.value) value.value = next
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-row justify="between"
        ><m-text as="h1" variant="heading">Tabs checks</m-text><ThemeSwitch
      /></m-row>
      <m-tabs
        v-if="mounted"
        id="checked-tabs"
        :modelValue="value"
        :tabs="tabs"
        label="Content sections"
        :disabled="disabled"
        :keepAlive="keepAlive"
        @update:modelValue="update"
      >
        <template #default="{ value: panel }">
          <CachedPanelCheck v-if="keepAlive" />
          <m-column v-else gap="sm">
            <m-text>Panel: {{ typeof panel }} {{ panel }}</m-text>
            <m-input v-if="panel === 0" v-model="draft" label="Panel draft" />
            <m-text v-else>Only the active panel is mounted.</m-text>
          </m-column>
        </template>
      </m-tabs>
      <m-text>Value: {{ typeof value }} {{ value }}</m-text
      ><m-text>Changes: {{ changes }}</m-text>
      <m-button id="last" @click="value = 'last'">Select last externally</m-button>
      <m-button id="retain" @click="keepAlive = !keepAlive"
        >Retain panels: {{ keepAlive }}</m-button
      >
      <m-button id="reset" @click="value = 0">Reset to number</m-button>
      <m-button id="clear" @click="value = null">Clear selection</m-button>
      <m-button id="remove" @click="removed = !removed">Toggle last item</m-button>
      <m-button id="reject" @click="reject = !reject">Reject: {{ reject }}</m-button>
      <m-button id="disable" @click="disabled = !disabled">Disabled: {{ disabled }}</m-button>
      <m-button id="empty" @click="empty = !empty">Toggle empty</m-button>
      <m-button id="mount" @click="mounted = !mounted">Toggle host</m-button>
      <m-button @click="navigation.push('/checks/screen/next')">Navigate away</m-button>
    </m-column>
  </m-screen>
</template>
