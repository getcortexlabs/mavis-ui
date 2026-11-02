<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { avatarImage } from '../assets/avatar-image'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const { theme } = useMavisTheme()
const mode = ref<'image' | 'initials' | 'error'>('image')
const src = computed(() =>
  mode.value === 'image'
    ? avatarImage
    : mode.value === 'error'
      ? 'data:image/png;base64,broken'
      : '',
)
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-row justify="between" gap="sm">
        <m-text variant="overline" tone="accent">{{
          t(pt ? 'PESSOAS PRIMEIRO' : 'PEOPLE FIRST')
        }}</m-text>
        <m-badge :text="t(pt ? 'Criadora' : 'Creator')" tone="accent" size="sm" />
      </m-row>
      <m-avatar
        id="avatar-preview"
        :src="src"
        name="Marina Costa"
        size="xl"
        :accessibilityHidden="true"
      />
      <m-column gap="xs">
        <m-text variant="title">{{ t('Marina Costa') }}</m-text>
        <m-text tone="accent">{{
          t(pt ? 'Um rosto. Muitas histórias.' : 'One face. Many stories.')
        }}</m-text>
      </m-column>
    </m-column>
    <m-row gap="sm" wrap>
      <m-button
        size="sm"
        :variant="mode === 'image' ? 'primary' : 'secondary'"
        @click="mode = 'image'"
        >{{ t(pt ? 'Imagem' : 'Image') }}</m-button
      >
      <m-button
        size="sm"
        :variant="mode === 'initials' ? 'primary' : 'secondary'"
        @click="mode = 'initials'"
        >{{ t(pt ? 'Iniciais' : 'Initials') }}</m-button
      >
      <m-button
        size="sm"
        :variant="mode === 'error' ? 'primary' : 'secondary'"
        @click="mode = 'error'"
        >{{ t(pt ? 'Imagem indisponível' : 'Unavailable image') }}</m-button
      >
    </m-row>
    <m-text variant="caption" tone="muted">{{
      t(
        pt
          ? 'A identidade permanece, mesmo quando a imagem não chega.'
          : 'Identity stays, even when the image does not arrive.',
      )
    }}</m-text>
    <m-card gap="lg">
      <m-text variant="overline" tone="muted">{{
        t(pt ? 'EM QUALQUER ESCALA' : 'AT EVERY SCALE')
      }}</m-text>
      <m-row gap="md" wrap>
        <m-avatar
          v-for="size in ['sm', 'md', 'lg', 'xl'] as const"
          :key="size"
          name="Marina Costa"
          :size="size"
          :accessibilityLabel="t(`Marina Costa, ${size}`)"
        />
      </m-row>
      <m-row gap="md">
        <m-avatar name="Mavis Studio" shape="square" size="lg" />
        <m-avatar shape="square" size="lg" :accessibilityLabel="t(pt ? 'Visitante' : 'Guest')" />
        <m-column :width="0" :grow="1" gap="xs">
          <m-text variant="heading">{{
            t(pt ? 'Para cada identidade.' : 'For every identity.')
          }}</m-text>
          <m-text variant="caption" tone="muted">{{
            t(pt ? 'Pessoas, equipes e quem está chegando.' : 'People, teams and new arrivals.')
          }}</m-text>
        </m-column>
      </m-row>
    </m-card>
  </m-column>
</template>
