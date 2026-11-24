<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  added: 0 as number,
  symbol: 'heart' as string,
  saving: false as boolean,
  query: '' as string,
  notes: '' as string,
  email: '' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MRow id="only" gap="md" align="start">
      <MButton
        id="only-lg"
        icon="plus"
        size="lg"
        accessibilityLabel="Add one"
        @click="() => (state.added += 1)"
      />
      <MButton
        id="only-md"
        trailingIcon="plus"
        accessibilityLabel="Add two"
        @click="() => (state.added += 2)"
      />
      <MButton
        id="only-sm"
        :icon="state.symbol"
        size="sm"
        variant="secondary"
        accessibilityLabel="Add three"
        @click="() => (state.added += 3)"
      />
    </MRow>
    <MText>{{ `${state.added} added` }}</MText>
    <MRow id="sides" gap="md" align="start">
      <MButton id="leading" text="Next" icon="arrow-right" @click="() => (state.added = 0)" />
      <MButton
        id="trailing"
        text="Next"
        trailingIcon="arrow-right"
        variant="secondary"
        @click="() => (state.symbol = 'star')"
      />
      <MButton id="plain" text="Next" variant="ghost" @click="() => (state.added = 0)" />
    </MRow>
    <MRow gap="md" align="start">
      <MButton
        text="Save"
        icon="save"
        trailingIcon="chevron-down"
        :loading="state.saving"
        loadingText="Saving"
        loadingIndicator="ring"
        @click="() => (state.saving = true)"
      />
    </MRow>
    <MInput
      label="Search"
      :modelValue="state.query"
      @update:modelValue="(value) => (state.query = value)"
      placeholder="Find a place"
      icon="search"
      trailingIcon="mic"
    />
    <MInput
      label="Notes"
      :modelValue="state.notes"
      @update:modelValue="(value) => (state.notes = value)"
      :multiline="true"
      icon="pencil"
    />
    <MInput
      label="Email"
      :modelValue="state.email"
      @update:modelValue="(value) => (state.email = value)"
      error="Enter your email"
      :trailingIcon="state.symbol"
    />
  </MColumn>
</template>
