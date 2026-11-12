<script setup lang="ts">
import { ref } from 'vue'
import type { VirtualListHandle } from '#mavis'
import type { Stop } from './types'

const lineRef = ref<VirtualListHandle | null>(null)
const stops = ref<Stop[]>([
  { id: 's01', name: 'Alder Gate' },
  { id: 's02', name: 'Birch Row' },
  { id: 's03', name: 'Cedar Hill' },
  { id: 's04', name: 'Dock Street' },
  { id: 's05', name: 'Elm Park' },
  { id: 's06', name: 'Fern Lane' },
  { id: 's07', name: 'Glen Cross' },
  { id: 's08', name: 'Harbor Quay' },
  { id: 's09', name: 'Iris Court' },
  { id: 's10', name: 'Juniper Way' },
  { id: 's11', name: 'Kestrel Rise' },
  { id: 's12', name: 'Larch Bend' },
  { id: 's13', name: 'Mill Pond' },
  { id: 's14', name: 'North Field' },
  { id: 's15', name: 'Oak Square' },
  { id: 's16', name: 'Pine Wharf' },
  { id: 's17', name: 'Quarry Road' },
  { id: 's18', name: 'Reed Bank' },
  { id: 's19', name: 'Spruce Yard' },
  { id: 's20', name: 'Thorn Vale' },
  { id: 's21', name: 'Union Bridge' },
  { id: 's22', name: 'Vine Terrace' },
  { id: 's23', name: 'Willow End' },
  { id: 's24', name: 'Yarrow Green' },
  { id: 's25', name: 'Zinnia Place' },
  { id: 's26', name: 'Aster Close' },
  { id: 's27', name: 'Bay View' },
  { id: 's28', name: 'Clover Mead' },
  { id: 's29', name: 'Dune Walk' },
  { id: 's30', name: 'East Shore' },
])

function jump() {
  lineRef.value?.scrollToIndex(19)
}

function start() {
  lineRef.value?.scrollToIndex(0)
}

function drop() {
  stops.value.splice(0, 1)
}

function clear() {
  stops.value = []
}
</script>

<template>
  <MColumn gap="md">
    <MVirtualList
      ref="lineRef"
      id="line"
      label="Stops on the line"
      :items="stops"
      :row-height="48"
      :height="240"
      :overscan="0"
    >
      <template #default="{ item, index, itemKey }">
        <MRow :id="`stop-${itemKey}`" :height="48" padding-x="md" align="center">
          <MText>{{ index + 1 }}. {{ item.name }}</MText>
        </MRow>
      </template>
      <template #empty>
        <MText>No stops yet</MText>
      </template>
    </MVirtualList>
    <MRow gap="sm" wrap>
      <MButton text="Jump to 20" @click="jump" />
      <MButton text="Back to start" variant="secondary" @click="start" />
      <MButton text="Drop first" variant="secondary" @click="drop" />
      <MButton text="Clear" variant="ghost" @click="clear" />
    </MRow>
    <m-virtual-list
      id="late"
      v-slot="{ item }"
      label="Later stops"
      :items="stops"
      :row-height="40"
      :height="120"
      :overscan="0"
      :initial-index="10"
      empty-label="Nothing later"
    >
      <MRow :id="`late-${item.id}`" :height="40" padding-x="md" align="center">
        <MText tone="muted">{{ item.name }}</MText>
      </MRow>
    </m-virtual-list>
  </MColumn>
</template>
