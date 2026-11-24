<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  search: false as boolean,
  terms: false as boolean,
  locked: false as boolean,
  guests: 1 as number,
  reason: 'none' as string,
})
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText variant="title" as="h1">Lisbon weekend</MText>
      <MText>{{ `Guests: ${state.guests}` }}</MText>
      <MColumn id="summary">
        <MText>{{ `Last close: ${state.reason}` }}</MText>
      </MColumn>
      <MSheet
        id="search"
        :open="state.search"
        @update:open="
          (value) => {
            if (!state.locked) {
              state.search = value
            }
          }
        "
        @close="(next) => (state.reason = next)"
        title="Search flights"
        closeLabel="Close search"
        gap="md"
      >
        <MText>{{ `Guests: ${state.guests}` }}</MText>
        <MText>{{ `Last close: ${state.reason}` }}</MText>
        <MColumn id="search-swatch" :height="24" />
        <MRow gap="sm">
          <MButton text="Add guest" variant="secondary" @click="() => (state.guests += 1)" />
          <MButton
            :text="state.locked ? 'Unlock' : 'Lock'"
            variant="secondary"
            @click="() => (state.locked = !state.locked)"
          />
        </MRow>
        <MColumn id="search-done">
          <MButton text="Done" @click="() => (state.search = false)" />
        </MColumn>
      </MSheet>
      <MRow id="actions" gap="sm">
        <MButton text="Find flights" @click="() => (state.search = true)" />
        <MButton text="Terms" variant="secondary" @click="() => (state.terms = true)" />
      </MRow>
      <MSheet
        :open="state.terms"
        @update:open="(value) => (state.terms = value)"
        @close="(next) => (state.reason = next)"
        accessibilityLabel="Terms of the trip"
        :dismissible="false"
        :fullscreen="true"
        gap="md"
      >
        <MColumn id="terms-body">
          <MText>No refunds after Friday.</MText>
        </MColumn>
        <MButton text="Accept" @click="() => (state.terms = false)" />
      </MSheet>
    </MColumn>
  </MScreen>
</template>
