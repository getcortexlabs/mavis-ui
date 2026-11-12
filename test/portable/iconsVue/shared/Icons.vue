<script setup lang="ts">
import { ref } from 'vue'
import type { IconName } from '@getcortexlabs/mavis-core'
import { MButton, MColumn, MIcon, MRow, MText } from '#mavis'

const symbol = ref<IconName>('plus')
const tone = ref<'primary' | 'danger'>('primary')
const scale = ref<'sm' | 'lg'>('sm')
const points = ref(32)
const saved = ref(false)

function grow() {
  scale.value = 'lg'
  points.value = 40
}
</script>

<template>
  <MColumn gap="md">
    <MRow id="search-row" gap="sm">
      <MIcon id="search" name="search" tone="muted" />
      <MText>Search</MText>
    </MRow>
    <MRow id="sizes" gap="md" align="end">
      <MIcon id="size-sm" name="star" size="sm" />
      <m-icon id="size-md" name="star" />
      <MIcon id="size-lg" name="star" size="lg" />
      <MIcon id="size-named" name="star" :size="scale" />
      <MIcon id="size-points" name="star" :size="points" />
    </MRow>
    <MRow id="tray" gap="md" padding="md" radius="md" backgroundColor="#F4E9FF">
      <MIcon id="glyph" :name="symbol" :size="48" :tone="tone" />
      <MIcon id="fixed" name="minus" :size="48" tone="success" />
    </MRow>
    <MColumn id="column" :width="200">
      <MIcon id="in-column" name="bell" />
      <MText>Below the bell</MText>
    </MColumn>
    <MRow gap="sm">
      <MIcon
        id="status"
        :name="saved ? 'circle-check' : 'circle'"
        tone="success"
        :label="saved ? 'Saved' : 'Not saved'"
      />
      <MText>{{ saved ? 'Saved' : 'Draft' }}</MText>
    </MRow>
    <MRow gap="sm" wrap>
      <MButton text="Change icon" @click="symbol = symbol === 'plus' ? 'circle' : 'plus'" />
      <MButton text="Change tone" @click="tone = tone === 'primary' ? 'danger' : 'primary'" />
      <MButton text="Grow" @click="grow" />
      <MButton text="Save" @click="saved = true" />
    </MRow>
  </MColumn>
</template>
