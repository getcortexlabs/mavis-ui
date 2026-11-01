<script setup lang="ts">
import { ref } from 'vue'
import { mavis, midnight, type InputHandle } from '@getcortexlabs/mavis-core'
import {
  MChip,
  MEmptyState,
  MAccordion,
  MSegmentedControl,
  useMavisTheme,
  useToast,
  MTabs,
  MSkeleton,
  MProgress,
  MAlert,
  MListItem,
  MSeparator,
  MAvatar,
  MBadge,
  MDialog,
  MToast,
  MInput,
  MButton,
  MSelect,
} from 'mavis-renderer'

const { theme, setTheme } = useMavisTheme()
const toast = useToast()
const topic = ref(false)
const tag = ref(true)
const restored = ref(false)
const expanded = ref<(string | number)[]>([])
const period = ref<string | number | null>('week')
const name = ref('Mavis')
const volume = ref(30)
const show = ref(false)
const dialog = ref(false)
const section = ref<string | number | null>(0)
const loading = ref(false)
const saved = ref(false)
const input = ref<InputHandle>()

function confirmSave() {
  dialog.value = false
  save()
}

function save() {
  input.value?.blur()
  loading.value = true
  setTimeout(() => {
    loading.value = false
    saved.value = true
    toast.show({ message: 'Saved from the installed package', tone: 'success' })
  }, 300)
}
</script>

<template>
  <m-screen>
    <m-column padding="lg" gap="md">
      <m-text variant="title">Installed Mavis</m-text>
      <MListItem :title="name" description="Installed row" interactive @click="show = !show"
        ><template #leading><MAvatar :name="name" /></template
      ></MListItem>
      <MSeparator spacing="sm" />
      <m-row gap="sm"
        ><MAvatar :name="name" shape="square" /><MBadge
          :text="0"
          tone="accent"
          accessibilityLabel="0 unread messages"
      /></m-row>
      <m-row gap="sm" wrap>
        <MChip v-model="topic" label="Package topic" selectable />
        <m-chip
          v-if="tag"
          label="Installed tag"
          removable
          removeLabel="Remove installed tag"
          @remove="tag = false"
        />
      </m-row>
      <MEmptyState v-if="!tag && !restored" title="No installed tags" compact
        ><template #actions
          ><m-button @click="restored = true">Continue without tags</m-button></template
        ></MEmptyState
      >
      <m-text v-if="restored">Tag recovery complete</m-text>
      <MSegmentedControl
        v-model="period"
        :options="[
          { value: 'day', label: 'Daily' },
          { value: 'week', label: 'Weekly' },
        ]"
        label="Installed period"
      />
      <MAccordion
        v-model="expanded"
        :items="[{ value: 'help', title: 'Package help' }]"
        label="Installed help"
        ><template #default="{ item }"
          ><m-text>Answer {{ item.value }}</m-text></template
        ></MAccordion
      >
      <MProgress :value="volume" label="Installed progress" />
      <MAlert title="Installed message" tone="info"
        ><template #actions><MButton>Message details</MButton></template></MAlert
      >
      <MSkeleton width="60%" :height="16" :animated="false" />
      <MTabs
        v-model="section"
        :tabs="[
          { value: 0, label: 'Overview' },
          { value: 'notes', label: 'Notes' },
        ]"
        label="Installed sections"
      >
        <template #default="{ value }"
          ><m-text>Section {{ value }}</m-text></template
        >
      </MTabs>
      <m-row gap="sm" align="center">
        <m-box :width="20" :height="20" :backgroundColor="theme.colors.primary" radius="full" />
        <m-text>{{ theme.name }}</m-text>
      </m-row>
      <MInput
        ref="input"
        v-model="name"
        label="Name"
        :trailingAction="{ icon: 'x', label: 'Clear installed name' }"
        @action="name = ''"
      />
      <MSelect :options="[{ value: 1, label: 'One' }]" label="Interest" />
      <m-slider v-model="volume" label="Volume" />
      <m-text>Volume: {{ volume }}</m-text>
      <m-card padding="md"
        ><m-text>Hello, {{ name }}</m-text></m-card
      >
      <MButton :loading="loading" @click="save">Save</MButton>
      <m-text v-if="saved">Saved {{ name }}</m-text>
      <m-button variant="secondary" @click="show = !show">Details</m-button>
      <m-reveal :show="show"><m-text>Installed from a package</m-text></m-reveal>
      <m-button variant="ghost" @click="setTheme(theme.name === mavis.name ? midnight : mavis)">
        Change theme
      </m-button>
    </m-column>
    <MDialog
      v-model:open="dialog"
      title="Save profile?"
      confirmLabel="Save"
      @confirm="confirmSave"
    />
    <m-button @click="dialog = true">Confirm save</m-button>
    <MToast :controller="toast" />
  </m-screen>
</template>
