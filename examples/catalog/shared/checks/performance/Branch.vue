<script setup lang="ts">
import { workload } from './state'
defineProps<{ depth: number; index: number; revision: number; grow?: number }>()
</script>

<template>
  <m-column v-if="depth > 0" :gap="4" :padding="2" :grow="grow">
    <m-row align="stretch">
      <Branch :depth="depth - 1" :index="index" :revision="revision" :grow="1" />
    </m-row>
  </m-column>
  <m-card v-else padding="md" gap="sm" :grow="grow">
    <m-text variant="heading">Sessão {{ index + 1 }}</m-text>
    <m-text>{{
      revision % 2
        ? 'Preferências de concentração e notificações durante a sessão. Einstellungen für Benachrichtigungen.'
        : 'Uma pausa para concentrar.'
    }}</m-text>
    <m-button
      :id="`performance-button-${index}`"
      :loading="workload.busy"
      loadingText="Preparando preferências da sessão…"
      >{{
        revision % 2 ? 'Preparar preferências de concentração' : `Preparar sessão ${index + 1}`
      }}</m-button
    >
  </m-card>
</template>
