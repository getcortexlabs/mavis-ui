<script setup lang="ts">
import { mavis, midnight } from '@mavis-ui/core'
import { useMavisTheme } from '@mavis-ui/core/vue'

const { theme, setTheme } = useMavisTheme()
</script>

<template>
  <m-button
    size="sm"
    variant="secondary"
    accessibilityLabel="Trocar tema"
    @click="setTheme(theme.appearance === 'dark' ? mavis : midnight)"
  >
    {{ theme.appearance === 'dark' ? '◐ Claro' : '◐ Escuro' }}
  </m-button>
</template>
