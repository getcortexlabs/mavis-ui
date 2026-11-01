<script setup lang="ts">
import { computed, ref } from 'vue'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const copy = computed(() =>
  props.lang === 'pt'
    ? {
        eyebrow: 'CADA PASSO CONTA',
        moving: 'A caminho.',
        preparing: 'Preparando sua coleção.',
        description: 'Uma boa ideia merece ir com você.',
        label: 'Download da coleção',
        pending: 'Preparando',
        advance: 'Avançar',
        reset: 'Zerar',
        value: 'Valor do progresso',
        indeterminate: 'Progresso indeterminado',
        helper: 'Use quando o tamanho da tarefa ainda não é conhecido.',
        hide: 'Ocultar indicador',
        show: 'Mostrar indicador',
        sizes: 'O peso certo para cada contexto.',
        thickness: 'Espessura',
      }
    : {
        eyebrow: 'EVERY STEP COUNTS',
        moving: 'On its way.',
        preparing: 'Preparing your collection.',
        description: 'A good idea deserves to go with you.',
        label: 'Collection download',
        pending: 'Preparing',
        advance: 'Advance',
        reset: 'Reset',
        value: 'Progress value',
        indeterminate: 'Indeterminate progress',
        helper: 'Use when the size of the task is not yet known.',
        hide: 'Hide indicator',
        show: 'Show indicator',
        sizes: 'The right weight for every context.',
        thickness: 'Thickness',
      },
)
const value = ref(64)
const indeterminate = ref(false)
const visible = ref(true)
const percent = computed(() => `${Math.round(value.value)}%`)
</script>

<template>
  <m-column gap="lg" id="progress-demo">
    <m-card gap="lg">
      <m-row justify="between" gap="sm">
        <m-text variant="overline" tone="primary">{{ copy.eyebrow }}</m-text>
        <m-icon name="download" tone="primary" />
      </m-row>
      <m-column gap="xs">
        <m-text variant="display" tone="primary">{{
          indeterminate ? copy.moving : percent
        }}</m-text>
        <m-text tone="muted">{{ indeterminate ? copy.preparing : copy.description }}</m-text>
      </m-column>
      <m-progress
        v-if="visible"
        id="progress-example"
        :value="value"
        :indeterminate="indeterminate"
        :label="copy.label"
        :indeterminateLabel="copy.pending"
        size="lg"
      />
      <m-row gap="sm" wrap>
        <m-button
          size="sm"
          :disabled="indeterminate || value === 100"
          @click="value = Math.min(100, value + 20)"
          >{{ copy.advance }}</m-button
        >
        <m-button size="sm" variant="ghost" :disabled="indeterminate" @click="value = 0">{{
          copy.reset
        }}</m-button>
      </m-row>
    </m-card>
    <m-slider v-model="value" :disabled="indeterminate" :label="copy.value" />
    <m-switch v-model="indeterminate" :label="copy.indeterminate" :helperText="copy.helper" />
    <m-button size="sm" variant="secondary" @click="visible = !visible">{{
      visible ? copy.hide : copy.show
    }}</m-button>
    <m-column gap="md">
      <m-text variant="heading">{{ copy.sizes }}</m-text>
      <m-column v-for="size in ['sm', 'md', 'lg'] as const" :key="size" gap="sm">
        <m-text variant="caption" tone="muted">{{ size }}</m-text>
        <m-progress :value="72" :size="size" tone="accent" :label="`${copy.thickness} ${size}`" />
      </m-column>
    </m-column>
  </m-column>
</template>
