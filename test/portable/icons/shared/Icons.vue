<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  symbol: 'plus' as string,
  tone: 'primary' as string,
  scale: 'sm' as string,
  points: 32 as number,
  saved: false as boolean,
  grow(): void {
    state.scale = 'lg'
    state.points = 40
  },
})
</script>

<template>
  <MColumn gap="md">
    <MRow id="search-row" gap="sm">
      <MIcon id="search" name="search" tone="muted" />
      <MText>Search</MText>
    </MRow>
    <MRow id="sizes" gap="md" align="end">
      <MIcon id="size-sm" name="star" size="sm" />
      <MIcon id="size-md" name="star" />
      <MIcon id="size-lg" name="star" size="lg" />
      <MIcon id="size-named" name="star" :size="state.scale" />
      <MIcon id="size-points" name="star" :size="state.points" />
    </MRow>
    <MRow id="tray" gap="md" padding="md" radius="md" backgroundColor="#F4E9FF">
      <MIcon id="glyph" :name="state.symbol" :size="48" :tone="state.tone" />
      <MIcon id="fixed" name="minus" :size="48" tone="success" />
    </MRow>
    <MColumn id="column" :width="200">
      <MIcon id="in-column" name="bell" />
      <MText>Below the bell</MText>
    </MColumn>
    <MRow gap="sm">
      <MIcon
        id="status"
        :name="state.saved ? 'circle-check' : 'circle'"
        tone="success"
        :label="state.saved ? 'Saved' : 'Not saved'"
      />
      <MText>{{ state.saved ? 'Saved' : 'Draft' }}</MText>
    </MRow>
    <MRow gap="sm" :wrap="true">
      <MButton
        text="Change icon"
        @click="() => (state.symbol = state.symbol === 'plus' ? 'circle' : 'plus')"
      />
      <MButton
        text="Change tone"
        @click="() => (state.tone = state.tone === 'primary' ? 'danger' : 'primary')"
      />
      <MButton text="Grow" @click="() => state.grow()" />
      <MButton text="Save" @click="() => (state.saved = true)" />
    </MRow>
  </MColumn>
</template>
