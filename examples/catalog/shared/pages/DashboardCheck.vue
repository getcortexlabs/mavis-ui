<script setup lang="ts">
import { defineComponent, inject, ref } from 'vue'
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
const active = ref(true)
const Kept = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
})
const language = inject<'en' | 'pt'>('mavis.dashboardLanguage', 'en')
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="lg"
      ><MButton
        id="dashboard-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length" />
      <MButton id="dashboard-active" text="Toggle KeepAlive" @click="active = !active" />
      <KeepAlive
        ><Kept v-if="active"
          ><component
            :is="demos[index]"
            :key="index"
            :lang="language" /></Kept></KeepAlive></MColumn
  ></MScreen>
</template>
