<script setup lang="ts">
import { computed } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { theme, appearance, setAppearance } = useMavisTheme()
const next = computed(() =>
  appearance.value === 'system' ? (theme.value.appearance === 'dark' ? 'light' : 'dark') : 'system',
)
const labels = { system: '◐ Sistema', light: '◐ Claro', dark: '◐ Escuro' }
</script>

<template>
  <m-button
    size="sm"
    variant="secondary"
    accessibilityLabel="Trocar tema"
    @click="setAppearance(next)"
  >
    {{ labels[next] }}
  </m-button>
</template>
