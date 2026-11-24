<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  left: 0 as number,
  told: 0 as number,
  saved: false as boolean,
  leave(): void {
    state.left = state.left + 1
  },
})
</script>

<template>
  <MColumn gap="md">
    <MAppBar
      id="bar"
      title="Library"
      :subtitle="`Left ${state.left} times`"
      :back="true"
      backLabel="Back to shelves"
      :navigateBack="() => state.leave()"
      @back="() => (state.told = state.told + 1)"
    >
      <template #leading>
        <MIcon id="mark" name="book-open" />
      </template>
      <template #actions>
        <MButton
          id="save"
          text="Save"
          variant="secondary"
          size="sm"
          @click="() => (state.saved = true)"
        />
      </template>
    </MAppBar>
    <MText id="status">{{ `${state.saved ? 'Saved' : 'Not saved'}, told ${state.told}` }}</MText>
    <MAppBar id="plain" title="Plain" />
  </MColumn>
</template>
