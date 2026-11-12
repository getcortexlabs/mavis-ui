<script setup lang="ts">
import { ref } from 'vue'

const search = ref(false)
const terms = ref(false)
const locked = ref(false)
const guests = ref(1)
const reason = ref('none')
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText variant="title" as="h1">Lisbon weekend</MText>
      <MText>Guests: {{ guests }}</MText>
      <MColumn id="summary">
        <MText>Last close: {{ reason }}</MText>
      </MColumn>
      <MSheet
        id="search"
        :open="search"
        title="Search flights"
        close-label="Close search"
        gap="md"
        @update:open="
          (value) => {
            if (!locked) search = value
          }
        "
        @close="(next) => (reason = next)"
      >
        <MText>Guests: {{ guests }}</MText>
        <MText>Last close: {{ reason }}</MText>
        <MColumn id="search-swatch" :height="24" />
        <MRow gap="sm">
          <MButton text="Add guest" variant="secondary" @click="guests += 1" />
          <MButton
            :text="locked ? 'Unlock' : 'Lock'"
            variant="secondary"
            @click="locked = !locked"
          />
        </MRow>
        <MColumn id="search-done">
          <MButton text="Done" @click="search = false" />
        </MColumn>
      </MSheet>
      <MRow id="actions" gap="sm">
        <MButton text="Find flights" @click="search = true" />
        <MButton text="Terms" variant="secondary" @click="terms = true" />
      </MRow>
      <m-sheet
        v-model:open="terms"
        accessibility-label="Terms of the trip"
        :dismissible="false"
        fullscreen
        gap="md"
        @close="(next) => (reason = next)"
      >
        <MColumn id="terms-body">
          <MText>No refunds after Friday.</MText>
        </MColumn>
        <MButton text="Accept" @click="terms = false" />
      </m-sheet>
    </MColumn>
  </MScreen>
</template>
