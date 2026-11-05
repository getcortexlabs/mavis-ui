<script setup lang="ts">
import { ref } from 'vue'
import DataTableDemo from '../demos/DataTableDemo.vue'
import CarouselDemo from '../demos/CarouselDemo.vue'
import RangeSliderDemo from '../demos/RangeSliderDemo.vue'
import CalendarDemo from '../demos/CalendarDemo.vue'
import RatingDemo from '../demos/RatingDemo.vue'
import TreeViewDemo from '../demos/TreeViewDemo.vue'
const demos = [DataTableDemo, CarouselDemo, RangeSliderDemo, CalendarDemo, RatingDemo, TreeViewDemo]
const index = ref(0)
</script>
<template>
  <MScreen scroll>
    <MColumn padding="md" gap="md">
      <MButton
        id="discovery-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length"
      />
      <component :is="demos[index]" :key="index" lang="en" />
    </MColumn>
  </MScreen>
</template>
