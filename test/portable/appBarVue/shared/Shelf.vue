<script setup lang="ts">
import { ref } from 'vue'

const left = ref(0)
const told = ref(0)
const saved = ref(false)

function leave() {
  left.value = left.value + 1
}
</script>

<template>
  <MColumn gap="md">
    <MAppBar
      id="bar"
      title="Library"
      :subtitle="`Left ${left} times`"
      back
      back-label="Back to shelves"
      :navigate-back="leave"
      @back="told = told + 1"
    >
      <template #leading>
        <MIcon id="mark" name="book-open" />
      </template>
      <template #actions>
        <MButton id="save" variant="secondary" size="sm" @click="saved = true">Save</MButton>
      </template>
    </MAppBar>
    <MText id="status">{{ saved ? 'Saved' : 'Not saved' }}, told {{ told }}</MText>
    <m-app-bar id="plain" title="Plain" />
  </MColumn>
</template>
