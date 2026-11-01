<script setup lang="ts">
import { useCatalog } from '../context'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog()
const { theme } = useMavisTheme()
</script>

<template>
  <m-screen scroll class="showcase-page">
    <m-column padding="lg" gap="xl" class="showcase-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/')">← Componentes</m-button>
        <ThemeSwitch />
      </m-row>
      <m-column gap="sm">
        <m-text variant="overline" tone="primary">DO DETALHE AO TODO</m-text>
        <m-text as="h1" variant="display">Showcase</m-text>
        <m-text tone="muted">Os componentes encontram seu contexto.</m-text>
      </m-column>
      <m-column padding="lg" radius="lg" gap="xl" :backgroundColor="theme.colors.accentSoft">
        <m-row justify="between">
          <m-text variant="overline" tone="accent">01 / CONTROLES DE VEÍCULO</m-text>
          <m-text variant="heading" tone="accent">↗</m-text>
        </m-row>
        <m-column gap="sm" paddingY="lg">
          <m-text variant="display" tone="accent">328</m-text>
          <m-text tone="accent">Quilômetros de possibilidades.</m-text>
          <m-row gap="xs" :accessibilityHidden="true">
            <m-box
              v-for="n in 16"
              :key="n"
              :width="0"
              :grow="1"
              :height="7"
              radius="full"
              :backgroundColor="n < 13 ? theme.colors.accent : theme.colors.surface"
            />
          </m-row>
        </m-column>
        <m-card gap="md">
          <m-row justify="between" gap="md">
            <m-column gap="xs">
              <m-text variant="overline" tone="muted">SEU ESPAÇO</m-text>
              <m-text variant="title">21°</m-text>
            </m-column>
            <m-column
              :width="48"
              :height="48"
              radius="full"
              align="center"
              justify="center"
              :backgroundColor="theme.colors.primarySoft"
            >
              <m-text variant="heading" tone="primary">✦</m-text>
            </m-column>
          </m-row>
          <m-text variant="caption" tone="muted"
            >Clima, bateria e ações rápidas. Duas telas, uma experiência.</m-text
          >
        </m-card>
        <m-button @click="navigation.push('/showcase/vehicle')">Explorar veículo ↗</m-button>
      </m-column>
      <m-text variant="caption" tone="muted">Button · Slider · Card · Reveal · Layouts</m-text>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">02 / SESSÃO DE FOCO</m-text>
        <m-text variant="title">Encontre seu ritmo.</m-text>
        <m-text tone="muted">Escolha um ambiente e reserve um momento para você.</m-text>
        <m-button @click="navigation.push('/showcase/focus')">Explorar foco ↗</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">03 / PERFIL</m-text>
        <m-text variant="title">Do seu jeito.</m-text>
        <m-text tone="muted">Sua identidade em cada detalhe. Edite, veja e salve.</m-text>
        <m-button @click="navigation.push('/showcase/profile')">Explorar perfil ↗</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">04 / EQUIPE</m-text>
        <m-text variant="title">Juntos, vamos mais longe.</m-text>
        <m-text tone="muted"
          >Conheça as pessoas, encontre seu ritmo e guarde os contatos favoritos.</m-text
        >
        <m-button @click="navigation.push('/showcase/team')">Explorar equipe ↗</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">05 / BIBLIOTECA</m-text>
        <m-text variant="title">Boas ideias. Por perto.</m-text>
        <m-text tone="muted">Explore seus assuntos e guarde as ideias que ficam.</m-text>
        <m-button @click="navigation.push('/showcase/library')">Explorar biblioteca ↗</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">06 / CENTRAL DE AJUDA</m-text>
        <m-text variant="title">Um atalho para continuar.</m-text>
        <m-text tone="muted">Escolha um assunto. Encontre a resposta. Siga em frente.</m-text>
        <m-button @click="navigation.push('/showcase/help')">Explorar ajuda ↗</m-button>
      </m-card>
    </m-column>
  </m-screen>
</template>
