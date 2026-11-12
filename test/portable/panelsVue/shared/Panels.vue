<script setup lang="ts">
import { ref } from 'vue'

const split = ref(40)
const rows = ref(50)

// The source keeps the library from growing past 44 percent.
function choose(value: number) {
  if (value <= 44) split.value = value
}
</script>

<template>
  <MColumn gap="md">
    <MResizablePanels
      id="workspace"
      label="Workspace split"
      :model-value="split"
      collapsible
      :height="160"
      primary-label="Library"
      secondary-label="Reader"
      @update:model-value="choose"
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
    <MText>Split {{ split }}</MText>
    <m-resizable-panels
      v-model="rows"
      label="Stacked split"
      orientation="vertical"
      :height="240"
      :step="5"
      primary-label="Top"
      secondary-label="Bottom"
    >
      <template v-slot:primary>
        <MText id="top-text">Above</MText>
      </template>
      <template #secondary>
        <MText id="bottom-text">Below</MText>
      </template>
    </m-resizable-panels>
    <MText>Rows {{ rows }}</MText>
  </MColumn>
</template>
