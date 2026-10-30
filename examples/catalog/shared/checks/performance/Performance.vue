<script setup lang="ts">
import { onMounted } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import Branch from './Branch.vue'
import { workload } from './state'
import { runPerformance } from './run'

const theme = useMavisTheme()
onMounted(() => void runPerformance(theme))
</script>

<template>
  <m-screen scroll>
    <m-column id="performance-root" padding="md" gap="md">
      <m-text variant="heading">Performance check</m-text>
      <template v-if="workload.active">
        <Branch
          v-for="index in workload.count"
          :key="index"
          :depth="workload.depth"
          :index="index - 1"
          :revision="workload.revision"
        />
      </template>
      <m-card v-if="workload.controls" padding="md" gap="md">
        <m-slider
          id="performance-slider"
          v-model="workload.value"
          :min="0"
          :max="100"
          :step="1"
          label="Duração"
        />
        <m-text id="performance-value">{{ workload.value }} minutos</m-text>
        <m-button id="performance-press">Detalhes</m-button>
        <m-reveal :show="workload.revealed" id="performance-reveal">
          <m-text>Preferências de concentração durante a sessão.</m-text>
        </m-reveal>
      </m-card>
    </m-column>
  </m-screen>
</template>
