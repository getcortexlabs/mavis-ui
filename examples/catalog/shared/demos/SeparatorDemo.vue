<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const { theme } = useMavisTheme()
const vertical = ref(false)
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="md" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-text variant="overline" tone="primary">{{
        pt ? 'ESPAÇO PARA RESPIRAR' : 'ROOM TO BREATHE'
      }}</m-text>
      <m-text variant="title">{{
        pt ? 'Uma pausa entre ideias.' : 'A pause between ideas.'
      }}</m-text>
      <m-text tone="muted">{{
        pt ? 'Divisões discretas. Hierarquia clara.' : 'Quiet divisions. Clear hierarchy.'
      }}</m-text>
    </m-column>
    <m-card gap="sm">
      <m-text variant="heading">{{ pt ? 'O que importa' : 'What matters' }}</m-text>
      <m-text tone="muted">{{ pt ? 'Um bom começo.' : 'A good beginning.' }}</m-text>
      <m-separator id="separator-horizontal" spacing="sm" inset="sm" />
      <m-text tone="muted">{{
        pt ? 'E espaço para o que vem depois.' : 'And room for what comes next.'
      }}</m-text>
    </m-card>
    <m-card>
      <m-row :height="72" justify="center">
        <m-column gap="xs" :width="0" :grow="1" align="center">
          <m-text variant="heading">12</m-text
          ><m-text variant="caption" tone="muted">{{ pt ? 'Projetos' : 'Projects' }}</m-text>
        </m-column>
        <m-separator id="separator-vertical" orientation="vertical" spacing="md" inset="sm" />
        <m-column gap="xs" :width="0" :grow="1" align="center">
          <m-text variant="heading">4</m-text
          ><m-text variant="caption" tone="muted">{{ pt ? 'Pessoas' : 'People' }}</m-text>
        </m-column>
      </m-row>
    </m-card>
    <m-card gap="md">
      <m-row justify="center" align="center" :height="104">
        <m-separator
          id="separator-changing"
          :orientation="vertical ? 'vertical' : 'horizontal'"
          :length="80"
        />
      </m-row>
      <m-button variant="secondary" @click="vertical = !vertical">{{
        pt ? 'Alternar orientação' : 'Change orientation'
      }}</m-button>
    </m-card>
  </m-column>
</template>
