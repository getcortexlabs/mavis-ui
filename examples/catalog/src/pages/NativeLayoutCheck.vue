<script setup lang="ts">
import { ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

declare const __LAYOUT_SCROLL__: boolean
const scroll = __LAYOUT_SCROLL__
const { theme } = useMavisTheme()
const expanded = ref(false)
const text = 'Conteúdo do Core dentro de uma coluna Mavis, com quebra de linha quando necessário.'
</script>

<template>
  <m-screen :scroll="scroll">
    <m-column id="native-layout" :padding="20" :gap="16">
      <m-text as="h1" variant="heading">Views do Core</m-text>
      <m-button id="change-content" @click="expanded = !expanded">{{
        expanded ? 'Caber na tela' : 'Transbordar'
      }}</m-button>
      <GridLayout id="core-grid" height="58" :backgroundColor="theme.colors.primarySoft" />
      <StackLayout id="core-stack" height="58" :backgroundColor="theme.colors.accentSoft" />
      <GridLayout id="core-grid-auto" rows="auto" :backgroundColor="theme.colors.surface">
        <Label id="core-grid-label" :text="text" textWrap="true" />
      </GridLayout>
      <StackLayout id="core-stack-auto" :backgroundColor="theme.colors.surface">
        <Label id="core-stack-label" :text="text" textWrap="true" />
      </StackLayout>
      <m-box id="box-auto" radius="md">
        <m-box id="box-auto-layer" radius="md" :backgroundColor="theme.colors.primarySoft" />
        <m-column id="box-auto-content" padding="sm">
          <m-text>Camada com a altura do conteúdo</m-text>
        </m-column>
      </m-box>
      <m-box id="box-fixed" :height="58" radius="md" :backgroundColor="theme.colors.accentSoft" />
      <GridLayout
        id="core-grid-shrink"
        height="58"
        flexShrink="1"
        :backgroundColor="theme.colors.primary"
      />
      <m-box id="filler" :height="expanded ? 1200 : 8" :backgroundColor="theme.colors.border" />
    </m-column>
  </m-screen>
</template>
