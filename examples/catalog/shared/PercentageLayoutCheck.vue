<script setup lang="ts">
import { percentageCases } from './percentage-cases'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

defineProps<{ expanded: boolean }>()
const { theme } = useMavisTheme()
</script>

<template>
  <m-column gap="sm">
    <m-text as="h2" variant="heading">Percentage widths and padding</m-text>
    <m-column v-for="item in percentageCases(expanded)" :key="item.id" gap="xs">
      <m-text variant="caption"
        >{{ item.container }} · {{ item.padding }} padding ·
        {{ item.expectedWidth ?? item.width ?? 'auto' }}{{ item.nested ? ' · nested' : '' }}</m-text
      >
      <component
        :is="item.container"
        :id="`${item.id}-parent`"
        :padding="item.padding"
        :align="item.align"
        :backgroundColor="theme.colors.surface"
      >
        <m-column v-if="item.nested" :id="`${item.id}-inner`">
          <m-box
            :id="`${item.id}-child`"
            :width="item.width"
            :height="16"
            :backgroundColor="theme.colors.primary"
          />
        </m-column>
        <component
          :is="item.skeleton ? 'MSkeleton' : 'MBox'"
          v-else
          :id="`${item.id}-child`"
          :width="item.width"
          :style="item.style"
          v-bind="item.skeleton ? { animated: false } : {}"
          :grow="item.width === undefined && item.container === 'MRow' ? 1 : 0"
          :height="16"
          :backgroundColor="theme.colors.primary"
        />
      </component>
    </m-column>
  </m-column>
</template>
