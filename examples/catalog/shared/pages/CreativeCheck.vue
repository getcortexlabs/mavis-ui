<script setup lang="ts">
import { ref } from 'vue'
import ColorPickerDemo from '../demos/ColorPickerDemo.vue'
import SwipeDeckDemo from '../demos/SwipeDeckDemo.vue'
import GaugeDemo from '../demos/GaugeDemo.vue'
import TourDemo from '../demos/TourDemo.vue'
import TransferListDemo from '../demos/TransferListDemo.vue'
import MarqueeDemo from '../demos/MarqueeDemo.vue'
const demos = [ColorPickerDemo, SwipeDeckDemo, GaugeDemo, TourDemo, TransferListDemo, MarqueeDemo]
const index = ref(0)
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="lg"
      ><MButton
        id="creative-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length" /><component
        :is="demos[index]"
        :key="index"
        lang="en" /></MColumn
  ></MScreen>
</template>
