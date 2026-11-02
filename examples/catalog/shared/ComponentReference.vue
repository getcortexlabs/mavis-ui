<script setup lang="ts">
import { useCatalogLocale } from './locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { references, compositionProperties } from './reference'
import { englishReferences } from './locale/reference.en'
import ReferenceProperties from './ReferenceProperties.vue'

const { t, locale } = useCatalogLocale()

const props = defineProps<{ id: string }>()
const reference = computed(() =>
  locale.value === 'en'
    ? (englishReferences[props.id] ?? references[props.id])
    : references[props.id],
)
const layout = ref(false)
const { theme } = useMavisTheme()
</script>

<template>
  <m-column v-if="reference" gap="lg" class="component-reference">
    <m-text variant="overline" tone="muted">{{ t('REFERÊNCIA') }}</m-text>
    <m-row justify="between" gap="sm">
      <m-text as="h2" variant="heading">{{ t('Como usar') }}</m-text>
      <m-text variant="overline" tone="muted">{{ t('VUE') }}</m-text>
    </m-row>
    <m-column padding="md" radius="md" :backgroundColor="theme.colors.accentSoft">
      <m-text
        variant="caption"
        tone="accent"
        :text="reference.usage"
        class="component-code"
        :style="{ fontFamily: 'monospace' }"
      />
    </m-column>

    <m-row justify="between" gap="sm">
      <m-text as="h2" variant="heading">{{ t('Propriedades') }}</m-text>
      <m-text variant="overline" tone="muted">{{ t('TIPO / PADRÃO') }}</m-text>
    </m-row>
    <ReferenceProperties :properties="reference.properties" />

    <m-column v-if="reference.layout" gap="sm">
      <m-button variant="secondary" @click="layout = !layout"
        >{{ layout ? '− ' : '+ ' }}{{ t(' Layout e espaçamento') }}</m-button
      >
      <m-reveal :show="layout"
        ><ReferenceProperties
          :properties="
            compositionProperties.map((property) => ({
              ...property,
              defaultValue: locale === 'en' ? t(property.defaultValue) : property.defaultValue,
            }))
          "
      /></m-reveal>
    </m-column>

    <template v-if="reference.events">
      <m-text as="h2" variant="heading">{{ t('Eventos') }}</m-text>
      <m-card v-for="event in reference.events" :key="event.name" padding="md" gap="sm">
        <m-text tone="primary">{{ event.name }}</m-text>
        <m-text variant="caption" tone="accent">{{ event.payload }}</m-text>
        <m-text variant="caption" tone="muted">{{ t(event.description) }}</m-text>
      </m-card>
    </template>

    <m-text as="h2" variant="heading">{{ t('Comportamento') }}</m-text>
    <m-text variant="caption" tone="muted">{{ t(reference.behavior) }}</m-text>
  </m-column>
</template>
