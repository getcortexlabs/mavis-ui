<script setup lang="ts">
import { ref } from 'vue'
import type { IconName } from '@getcortexlabs/mavis-core'
import { MButton, MColumn, MInput, MRow, MText } from '#mavis'

const added = ref(0)
const symbol = ref<IconName>('heart')
const saving = ref(false)
const query = ref('')
const notes = ref('')
const email = ref('')
</script>

<template>
  <MColumn gap="md">
    <MRow id="only" gap="md" align="start">
      <MButton
        id="only-lg"
        icon="plus"
        size="lg"
        accessibilityLabel="Add one"
        @click="added += 1"
      />
      <MButton id="only-md" trailing-icon="plus" accessibilityLabel="Add two" @click="added += 2" />
      <m-button
        id="only-sm"
        :icon="symbol"
        size="sm"
        variant="secondary"
        accessibility-label="Add three"
        @click="added += 3"
      />
    </MRow>
    <MText>{{ added }} added</MText>
    <MRow id="sides" gap="md" align="start">
      <MButton id="leading" icon="arrow-right" @click="added = 0">Next</MButton>
      <MButton id="trailing" trailingIcon="arrow-right" variant="secondary" @click="symbol = 'star'"
        >Next</MButton
      >
      <MButton id="plain" text="Next" variant="ghost" @click="added = 0" />
    </MRow>
    <MRow gap="md" align="start">
      <MButton
        text="Save"
        icon="save"
        trailingIcon="chevron-down"
        :loading="saving"
        loadingText="Saving"
        loadingIndicator="ring"
        @click="saving = true"
      />
    </MRow>
    <MInput
      v-model="query"
      label="Search"
      placeholder="Find a place"
      icon="search"
      trailingIcon="mic"
    />
    <MInput v-model="notes" label="Notes" multiline icon="pencil" />
    <MInput v-model="email" label="Email" error="Enter your email" :trailingIcon="symbol" />
  </MColumn>
</template>
