<script setup lang="ts">
import { ref } from 'vue'
import CommandPaletteDemo from '../demos/CommandPaletteDemo.vue'
import NavigationRailDemo from '../demos/NavigationRailDemo.vue'
import BreadcrumbDemo from '../demos/BreadcrumbDemo.vue'
import TooltipDemo from '../demos/TooltipDemo.vue'
import TimelineDemo from '../demos/TimelineDemo.vue'
import ChartDemo from '../demos/ChartDemo.vue'
const demos = [
  CommandPaletteDemo,
  NavigationRailDemo,
  BreadcrumbDemo,
  TooltipDemo,
  TimelineDemo,
  ChartDemo,
]
const index = ref(0)
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="md">
      <MButton
        id="wayfinding-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length"
      />
      <component :is="demos[index]" :key="index" lang="en" /> </MColumn
  ></MScreen>
</template>
