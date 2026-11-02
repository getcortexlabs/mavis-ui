<script setup lang="ts">
import { useCatalogLocale } from '../locale'

const { t } = useCatalogLocale()

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
</script>

<template>
  <m-column gap="md">
    <m-text variant="display">{{ t(lang === 'pt' ? 'Olá.' : 'Hello.') }}</m-text>
    <m-text variant="title">{{ t('Title') }}</m-text>
    <m-text variant="heading">{{ t('Heading') }}</m-text>
    <m-text
      >{{ t('Body · ')
      }}{{ t(lang === 'pt' ? 'Espaço para suas palavras.' : 'Room for your words.') }}</m-text
    >
    <m-text variant="caption" tone="muted"
      >{{ t('Caption · ')
      }}{{ t(lang === 'pt' ? 'Os pequenos detalhes.' : 'The small details.') }}</m-text
    >
    <m-text variant="heading"
      >{{ t(lang === 'pt' ? 'Cada palavra ' : 'Every word ')
      }}<m-span emphasis="em" tone="primary">{{
        t(lang === 'pt' ? 'tem seu lugar.' : 'has its place.')
      }}</m-span></m-text
    >
    <m-text variant="caption" weight="bold">{{
      t(
        lang === 'pt'
          ? 'Pequeno no tamanho. Forte na intenção.'
          : 'Small in size. Clear in intent.',
      )
    }}</m-text>
    <m-text variant="overline" tone="primary">{{ t('OVERLINE') }}</m-text>
    <m-row gap="md" wrap>
      <m-text tone="success">{{ t('Success') }}</m-text>
      <m-text tone="danger">{{ t('Danger') }}</m-text>
      <m-text tone="muted">{{ t('Muted') }}</m-text>
    </m-row>
  </m-column>
</template>
