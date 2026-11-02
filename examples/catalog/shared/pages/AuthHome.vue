<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t } = useCatalogLocale()

const { theme } = useMavisTheme()
const { navigation, memberName } = useCatalog()
const toast = useToast({ scope: 'app' })
const celebrate = () =>
  toast.show({
    title: t('A little momentum.'),
    message: t('Make something that matters to you.'),
    tone: 'success',
  })
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl" class="morrow-home">
      <m-row justify="between" gap="sm">
        <m-text variant="heading" tone="accent">{{ t('morrow') }}</m-text>
        <ThemeSwitch />
      </m-row>
      <m-column padding="xl" radius="lg" gap="lg" :backgroundColor="theme.colors.accentSoft">
        <m-badge :text="t('YOUR SPACE IS READY')" tone="accent" />
        <m-text as="h1" variant="display">{{ t('Hello, ') }}{{ t(memberName) }}.</m-text>
        <m-text>{{ t('A fresh page. A little possibility. What will you make of today?') }}</m-text>
        <m-row gap="sm" wrap>
          <m-button @click="celebrate"
            >{{ t('Start something good ')
            }}<template #trailing
              ><m-icon name="arrow-up-right" tone="onPrimary" :size="18"
            /></template>
          </m-button>
        </m-row>
      </m-column>
      <m-card gap="md" padding="lg">
        <m-icon name="notebook-pen" tone="primary" :size="32" />
        <m-text variant="title">{{ t('Leave a little room for an idea.') }}</m-text>
        <m-text tone="muted">{{
          t('Not every beginning needs a plan. Sometimes it just needs a place.')
        }}</m-text>
      </m-card>
      <m-button variant="ghost" @click="navigation.back('/showcase/morrow')">{{
        t('← Back to sign in')
      }}</m-button>
    </m-column>
  </m-screen>
</template>
