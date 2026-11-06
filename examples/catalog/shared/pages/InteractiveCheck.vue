<script setup lang="ts">
import { ref } from 'vue'
import SortableListDemo from '../demos/SortableListDemo.vue'
import SwipeActionsDemo from '../demos/SwipeActionsDemo.vue'
import NumberFlowDemo from '../demos/NumberFlowDemo.vue'
import ResizablePanelsDemo from '../demos/ResizablePanelsDemo.vue'
import ImageCompareDemo from '../demos/ImageCompareDemo.vue'
import ImageViewerDemo from '../demos/ImageViewerDemo.vue'
const demos = [
  SortableListDemo,
  SwipeActionsDemo,
  NumberFlowDemo,
  ResizablePanelsDemo,
  ImageCompareDemo,
  ImageViewerDemo,
]
const index = ref(0)
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="lg"
      ><MButton
        id="interactive-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length" /><component
        :is="demos[index]"
        :key="index"
        lang="en" /></MColumn
  ></MScreen>
</template>
