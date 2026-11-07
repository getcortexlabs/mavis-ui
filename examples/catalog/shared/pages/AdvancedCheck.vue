<script setup lang="ts">
import { ref } from 'vue'
import TreeSelectDemo from '../demos/TreeSelectDemo.vue'
import MasonryDemo from '../demos/MasonryDemo.vue'
import HeatmapDemo from '../demos/HeatmapDemo.vue'
import ImageCropperDemo from '../demos/ImageCropperDemo.vue'
import SchedulerDemo from '../demos/SchedulerDemo.vue'
import NotificationCenterDemo from '../demos/NotificationCenterDemo.vue'
const demos = [
  TreeSelectDemo,
  MasonryDemo,
  HeatmapDemo,
  ImageCropperDemo,
  SchedulerDemo,
  NotificationCenterDemo,
]
const index = ref(0)
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="lg"
      ><MButton
        id="advanced-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length" /><component
        :is="demos[index]"
        :key="index"
        lang="en" /></MColumn
  ></MScreen>
</template>
