<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  split: 40 as number,
  rows: 50 as number,
  choose(value: number): void {
    if (value <= 44) {
      state.split = value
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MResizablePanels
      id="workspace"
      label="Workspace split"
      :modelValue="state.split"
      @update:modelValue="(value) => state.choose(value)"
      :collapsible="true"
      :height="160"
      primaryLabel="Library"
      secondaryLabel="Reader"
    >
      <template #primary>
        <MBox id="library-pane" :height="40">
          <MText>Shelves</MText>
        </MBox>
      </template>
      <template #secondary>
        <MBox id="reader-pane" :height="40">
          <MText>Pages</MText>
        </MBox>
      </template>
    </MResizablePanels>
    <MText>{{ `Split ${state.split}` }}</MText>
    <MResizablePanels
      label="Stacked split"
      :modelValue="state.rows"
      @update:modelValue="(value) => (state.rows = value)"
      orientation="vertical"
      :height="240"
      :step="5"
      primaryLabel="Top"
      secondaryLabel="Bottom"
    >
      <template #primary>
        <MText id="top-text">Above</MText>
      </template>
      <template #secondary>
        <MText id="bottom-text">Below</MText>
      </template>
    </MResizablePanels>
    <MText>{{ `Rows ${state.rows}` }}</MText>
  </MColumn>
</template>
