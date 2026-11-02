<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
const mounted = ref(true)
const open = ref(false)
const dismissible = ref(true)
const reject = ref(false)
const long = ref(false)
const closes = ref(0)
const draft = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
const reopen = () => {
  open.value = false
  clearTimeout(timer)
  timer = setTimeout(() => {
    open.value = true
  }, 80)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-text variant="heading">Sheet lifecycle</m-text>
      <m-button @click="open = true">Open sheet</m-button>
      <m-button @click="mounted = !mounted">{{
        mounted ? 'Unmount sheet' : 'Mount sheet'
      }}</m-button>
      <m-text id="sheet-close-count">{{ closes }} close requests</m-text>
      <m-sheet
        v-if="mounted"
        :open="open"
        title="Lifecycle"
        :dismissible="dismissible"
        gap="md"
        @update:open="
          (value) => {
            if (!reject) open = value
          }
        "
        @close="closes++"
      >
        <m-input v-model="draft" label="Draft" />
        <m-button @click="reopen">Close and reopen</m-button>
        <m-button @click="reject = !reject">{{
          reject ? 'Accept dismissal' : 'Reject dismissal'
        }}</m-button>
        <m-button @click="dismissible = !dismissible">{{
          dismissible ? 'Disable dismissal' : 'Enable dismissal'
        }}</m-button>
        <m-button @click="long = !long">{{ long ? 'Less content' : 'More content' }}</m-button>
        <m-button @click="mounted = false">Remove presentation</m-button>
        <m-text v-for="n in long ? 20 : 0" :key="n">More room for line {{ n }}.</m-text>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
