<script setup lang="ts">
import { reactive } from 'vue'
import type { MenuItem } from './types'

const state = reactive({
  open: false as boolean,
  selected: 'none' as string,
  reason: 'none' as string,
  items: [
    {
      type: 'group',
      key: 'edit',
      label: 'Editing',
      value: undefined,
      icon: undefined,
      disabled: undefined,
      destructive: undefined,
    },
    {
      value: 'edit',
      label: 'Edit',
      icon: 'pencil',
      disabled: undefined,
      destructive: undefined,
      type: undefined,
      key: undefined,
    },
    {
      value: 'delete',
      label: 'Delete',
      disabled: true,
      icon: undefined,
      destructive: undefined,
      type: undefined,
      key: undefined,
    },
    {
      type: 'separator',
      key: 'more',
      value: undefined,
      label: undefined,
      icon: undefined,
      disabled: undefined,
      destructive: undefined,
    },
    {
      value: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      disabled: undefined,
      destructive: undefined,
      type: undefined,
      key: undefined,
    },
  ] as MenuItem[],
})
</script>

<template>
  <MColumn padding="lg" gap="md">
    <MMenu
      :open="state.open"
      @update:open="(value) => (state.open = value)"
      label="Document actions"
      triggerLabel="Actions"
      :items="
        state.items.map((item) =>
          item.type
            ? { type: item.type, key: item.key, label: item.label }
            : {
                value: item.value,
                label: item.label,
                icon: item.icon,
                disabled: item.disabled,
                destructive: item.destructive,
              },
        ) as never
      "
      @select="(value, item) => ((value) => (state.selected = value))(String(value), item as never)"
      @close="(value) => (state.reason = value)"
    />
    <MText>{{ `Selected: ${state.selected}` }}</MText>
    <MText>{{ `Closed: ${state.reason}` }}</MText>
  </MColumn>
</template>
