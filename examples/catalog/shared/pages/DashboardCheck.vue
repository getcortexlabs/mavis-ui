<script setup lang="ts">
import { ref } from 'vue'
import KanbanDemo from '../demos/KanbanDemo.vue'
import DonutChartDemo from '../demos/DonutChartDemo.vue'
import SparklineDemo from '../demos/SparklineDemo.vue'
import GradientBackgroundDemo from '../demos/GradientBackgroundDemo.vue'
import ParticleFieldDemo from '../demos/ParticleFieldDemo.vue'
import ConfettiDemo from '../demos/ConfettiDemo.vue'
const demos = [
  KanbanDemo,
  DonutChartDemo,
  SparklineDemo,
  GradientBackgroundDemo,
  ParticleFieldDemo,
  ConfettiDemo,
]
const index = ref(0)
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="lg"
      ><MButton
        id="dashboard-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length" /><component
        :is="demos[index]"
        :key="index"
        lang="en" /></MColumn
  ></MScreen>
</template>
