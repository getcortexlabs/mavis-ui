<script setup lang="ts">
import { usePanelPreferences } from './preferences'
const layout = usePanelPreferences()
</script>
<template>
  <MColumn gap="sm">
    <template v-if="layout.opened.value">
      <MResizablePanels
        label="Saved columns"
        :modelValue="layout.horizontal.value"
        @update:modelValue="(value) => layout.resizeHorizontal(value)"
        :step="5"
        :height="120"
        primaryLabel="Library"
        secondaryLabel="Reader"
        ><template #primary><MText>Shelves</MText></template
        ><template #secondary><MText>Pages</MText></template></MResizablePanels
      >
      <MResizablePanels
        label="Saved rows"
        orientation="vertical"
        :modelValue="layout.vertical.value"
        @update:modelValue="(value) => layout.resizeVertical(value)"
        :step="5"
        :height="160"
        primaryLabel="Top"
        secondaryLabel="Bottom"
        ><template #primary><MText>Above</MText></template
        ><template #secondary><MText>Below</MText></template></MResizablePanels
      >
    </template>
    <MText>{{ `Columns ${layout.horizontal.value}` }}</MText
    ><MText>{{ `Rows ${layout.vertical.value}` }}</MText
    ><MText>{{ layout.status.value }}</MText>
    <MButton text="Save layout" @click="layout.save()" /><MButton
      text="Close panels"
      @click="layout.close()"
    /><MButton text="Restore layout" @click="layout.open()" />
  </MColumn>
</template>
