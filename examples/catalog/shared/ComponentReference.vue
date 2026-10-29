<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { references, compositionProperties } from './reference'
import ReferenceProperties from './ReferenceProperties.vue'

const props = defineProps<{ id: string }>()
const reference = computed(() => references[props.id])
const layout = ref(false)
const { theme } = useMavisTheme()
</script>

<template>
  <m-column v-if="reference" gap="lg" class="component-reference">
    <m-column gap="md">
      <m-row justify="between" gap="sm">
        <m-text as="h2" variant="heading">Como usar</m-text>
        <m-text variant="overline" tone="muted">VUE</m-text>
      </m-row>
      <m-column padding="md" radius="md" :backgroundColor="theme.colors.accentSoft">
        <m-text
          variant="caption"
          tone="accent"
          :text="reference.usage"
          class="component-code"
          :style="{ fontFamily: 'monospace' }"
        />
      </m-column>
    </m-column>

    <m-column gap="md">
      <m-row justify="between" gap="sm">
        <m-text as="h2" variant="heading">Propriedades</m-text>
        <m-text variant="overline" tone="muted">TIPO / PADRÃO</m-text>
      </m-row>
      <ReferenceProperties :properties="reference.properties" />
    </m-column>

    <m-column v-if="reference.layout" gap="sm">
      <m-button variant="secondary" @click="layout = !layout"
        >{{ layout ? '−' : '+' }} Layout e espaçamento</m-button
      >
      <m-reveal :show="layout"
        ><ReferenceProperties :properties="compositionProperties"
      /></m-reveal>
    </m-column>

    <m-column v-if="reference.events" gap="md">
      <m-text as="h2" variant="heading">Eventos</m-text>
      <m-card v-for="event in reference.events" :key="event.name" padding="md" gap="sm">
        <m-text tone="primary">{{ event.name }}</m-text>
        <m-text variant="caption" tone="accent">{{ event.payload }}</m-text>
        <m-text variant="caption" tone="muted">{{ event.description }}</m-text>
      </m-card>
    </m-column>

    <m-column gap="sm">
      <m-text as="h2" variant="heading">Comportamento</m-text>
      <m-text variant="caption" tone="muted">{{ reference.behavior }}</m-text>
    </m-column>
  </m-column>
</template>
