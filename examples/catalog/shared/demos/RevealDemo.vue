<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const visible = ref(false)
</script>

<template>
  <m-column gap="md">
    <m-button @click="visible = !visible">
      {{
        visible
          ? lang === 'pt'
            ? 'Ocultar detalhes'
            : 'Hide details'
          : lang === 'pt'
            ? 'Mostrar detalhes'
            : 'Show details'
      }}
    </m-button>
    <m-reveal :show="visible">
      <m-card gap="sm">
        <m-text variant="heading">{{ lang === 'pt' ? 'Um pouco mais.' : 'A little more.' }}</m-text>
        <m-text tone="muted">{{
          lang === 'pt'
            ? 'O conteúdo entra e sai com a sua ação.'
            : 'Content enters and leaves with your action.'
        }}</m-text>
      </m-card>
    </m-reveal>
  </m-column>
</template>
