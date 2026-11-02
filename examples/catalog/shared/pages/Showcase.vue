<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { useCatalog } from '../context'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t } = useCatalogLocale()

const { navigation } = useCatalog()
const { theme } = useMavisTheme()
</script>

<template>
  <m-screen scroll class="showcase-page">
    <m-column padding="lg" gap="xl" class="showcase-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/')">{{
          t('← Componentes')
        }}</m-button>
        <ThemeSwitch />
      </m-row>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">14 / TEMPO</m-text>
        <m-text variant="title">{{ t('Cada detalhe. No seu tempo.') }}</m-text>
        <m-button @click="navigation.push('/showcase/tempo')">{{ t('Explorar Tempo ↗') }}</m-button>
      </m-card>
      <m-column gap="sm">
        <m-text variant="overline" tone="primary">{{ t('DO DETALHE AO TODO') }}</m-text>
        <m-text as="h1" variant="display">{{ t('Showcase') }}</m-text>
        <m-text tone="muted">{{ t('Os componentes encontram seu contexto.') }}</m-text>
        <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
          <m-text variant="overline" tone="accent">{{ t('10 / FIELD GUIDE') }}</m-text>
          <m-text variant="title">{{ t('Um novo ponto de vista.') }}</m-text>
          <m-text tone="muted">{{
            t('A tela acompanha a leitura, o tamanho e cada novo detalhe.')
          }}</m-text>
          <m-button @click="navigation.push('/showcase/field-guide')">{{
            t('Explorar Field Guide ↗')
          }}</m-button>
        </m-card>
        <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
          <m-text variant="overline" tone="primary">{{ t('12 / AFTERGLOW') }}</m-text>
          <m-text variant="title">{{ t('Fique mais um pouco.') }}</m-text>
          <m-text tone="muted">{{
            t('Uma noite de arte, novas perspectivas e encontros.')
          }}</m-text>
          <m-button @click="navigation.push('/showcase/afterglow')">{{
            t('Conhecer Afterglow ↗')
          }}</m-button>
        </m-card>
        <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
          <m-text variant="overline" tone="primary">{{ t('11 / GATHER') }}</m-text>
          <m-text variant="title">{{ t('Boas histórias começam com um encontro.') }}</m-text>
          <m-text tone="muted">{{ t('Uma data, um lugar e os detalhes que importam.') }}</m-text>
          <m-button @click="navigation.push('/showcase/gather')">{{
            t('Preparar um encontro ↗')
          }}</m-button>
        </m-card>
      </m-column>
      <m-column padding="lg" radius="lg" gap="xl" :backgroundColor="theme.colors.accentSoft">
        <m-row justify="between">
          <m-text variant="overline" tone="accent">{{ t('01 / CONTROLES DE VEÍCULO') }}</m-text>
          <m-text variant="heading" tone="accent">↗</m-text>
        </m-row>
        <m-column gap="sm" paddingY="lg">
          <m-text variant="display" tone="accent">328</m-text>
          <m-text tone="accent">{{ t('Quilômetros de possibilidades.') }}</m-text>
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
              <m-text variant="overline" tone="muted">{{ t('SEU ESPAÇO') }}</m-text>
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
          <m-text variant="caption" tone="muted">{{
            t('Clima, bateria e ações rápidas. Duas telas, uma experiência.')
          }}</m-text>
        </m-card>
        <m-button @click="navigation.push('/showcase/vehicle')">{{
          t('Explorar veículo ↗')
        }}</m-button>
      </m-column>
      <m-text variant="caption" tone="muted">{{
        t('Button · Slider · Card · Reveal · Layouts')
      }}</m-text>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">{{ t('02 / SESSÃO DE FOCO') }}</m-text>
        <m-text variant="title">{{ t('Encontre seu ritmo.') }}</m-text>
        <m-text tone="muted">{{ t('Escolha um ambiente e reserve um momento para você.') }}</m-text>
        <m-button @click="navigation.push('/showcase/focus')">{{ t('Explorar foco ↗') }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">{{ t('03 / PERFIL') }}</m-text>
        <m-text variant="title">{{ t('Do seu jeito.') }}</m-text>
        <m-text tone="muted">{{
          t('Sua identidade em cada detalhe. Edite, veja e salve.')
        }}</m-text>
        <m-button @click="navigation.push('/showcase/profile')">{{
          t('Explorar perfil ↗')
        }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">{{ t('04 / EQUIPE') }}</m-text>
        <m-text variant="title">{{ t('Juntos, vamos mais longe.') }}</m-text>
        <m-text tone="muted">{{
          t('Conheça as pessoas, encontre seu ritmo e guarde os contatos favoritos.')
        }}</m-text>
        <m-button @click="navigation.push('/showcase/team')">{{ t('Explorar equipe ↗') }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">{{ t('05 / BIBLIOTECA') }}</m-text>
        <m-text variant="title">{{ t('Boas ideias. Por perto.') }}</m-text>
        <m-text tone="muted">{{ t('Explore seus assuntos e guarde as ideias que ficam.') }}</m-text>
        <m-button @click="navigation.push('/showcase/library')">{{
          t('Explorar biblioteca ↗')
        }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">{{ t('06 / CENTRAL DE AJUDA') }}</m-text>
        <m-text variant="title">{{ t('Um atalho para continuar.') }}</m-text>
        <m-text tone="muted">{{
          t('Escolha um assunto. Encontre a resposta. Siga em frente.')
        }}</m-text>
        <m-button @click="navigation.push('/showcase/help')">{{ t('Explorar ajuda ↗') }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">{{ t('07 / ATELIER') }}</m-text>
        <m-text variant="title">{{ t('Menos pressa. Mais presença.') }}</m-text>
        <m-text tone="muted">{{
          t('Uma edição para ler com calma. Tipos, cores e pequenos detalhes.')
        }}</m-text>
        <m-button @click="navigation.push('/showcase/studio')">{{
          t('Explorar Atelier ↗')
        }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">{{ t('08 / MORROW') }}</m-text>
        <m-text variant="title">{{ t('Um espaço para começar.') }}</m-text>
        <m-text tone="muted">{{
          t('Entre, crie sua conta e leve a conversa para a próxima tela.')
        }}</m-text>
        <m-button @click="navigation.push('/showcase/morrow')">{{
          t('Explorar Morrow ↗')
        }}</m-button>
      </m-card>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">{{ t('09 / KINETIC') }}</m-text>
        <m-text variant="title">{{ t('Uma ideia em movimento.') }}</m-text>
        <m-text tone="muted">{{
          t('Arraste, solte e pegue de novo. Uma mesma animação na Web e no app.')
        }}</m-text>
        <m-button @click="navigation.push('/showcase/kinetic')">{{
          t('Explorar Kinetic ↗')
        }}</m-button>
      </m-card>

      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-text variant="overline" tone="primary">{{ t('13 / IDENTIDADE') }}</m-text>
        <m-text variant="title">{{ t('Seu lugar na tela.') }}</m-text>
        <m-text tone="muted">{{ t('Escolha o ícone que acompanha você.') }}</m-text>
        <m-button @click="navigation.push('/showcase/identity')">{{
          t('Explorar identidade ↗')
        }}</m-button>
      </m-card>
    </m-column>
  </m-screen>
</template>
