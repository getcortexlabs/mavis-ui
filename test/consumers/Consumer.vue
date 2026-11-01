<script setup lang="ts">
import { ref } from 'vue'
import { mavis, midnight, type InputHandle } from '@getcortexlabs/mavis-core'
import {
  useMavisTheme,
  useToast,
  MTabs,
  MDialog,
  MToast,
  MInput,
  MButton,
  MSelect,
} from 'mavis-renderer'

const { theme, setTheme } = useMavisTheme()
const toast = useToast()
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
      <MInput ref="input" v-model="name" label="Name" />
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
