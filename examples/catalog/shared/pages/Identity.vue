<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref } from 'vue'
import { appIconChoices, useAppIcons } from '../app-icons'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t } = useCatalogLocale()

const { navigation } = useCatalog()
const icons = useAppIcons()
const available = icons.supported()
const selected = ref<string>()
const pending = ref<string>()
const error = ref('')
try {
  selected.value = icons.current()
} catch {
  error.value = 'Confira os ícones configurados no aplicativo.'
}
async function choose(id: string) {
  if (pending.value) return
  pending.value = id
  error.value = ''
  try {
    await icons.select(id)
    selected.value = icons.current()
  } catch {
    error.value = 'O sistema não alterou o ícone. Você pode tentar novamente.'
  } finally {
    pending.value = undefined
  }
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl">
      <m-row justify="between" gap="sm">
        <m-link
          href="/showcase"
          :navigate="
            () => {
              navigation.back('/showcase')
            }
          "
          >{{ t('← Showcase') }}</m-link
        >
        <ThemeSwitch />
      </m-row>
      <m-column gap="md" paddingY="lg">
        <m-text variant="overline" tone="primary">{{ t('13 / IDENTIDADE') }}</m-text>
        <m-text as="h1" variant="display">{{ t('Seu lugar na tela.') }}</m-text>
        <m-text tone="muted">{{ t('Um pequeno detalhe que diz muito sobre você.') }}</m-text>
      </m-column>
      <m-alert
        v-if="!available"
        tone="info"
        :title="t('Experimente no aplicativo')"
        :description="
          t(
            'A prévia Web mostra as opções. A troca do ícone da tela inicial está disponível no catálogo iOS e Android.',
          )
        "
      />
      <m-stack gap="md" :responsive="{ at: 680, direction: 'row' }">
        <m-card v-for="icon in appIconChoices" :key="icon.id" gap="lg" :grow="1">
          <m-column
            :width="88"
            :height="88"
            radius="lg"
            justify="center"
            align="center"
            :backgroundColor="icon.color"
            :accessibilityHidden="true"
          >
            <m-text variant="display" :style="{ color: '#FFF9F3' }">{{ t('M') }}</m-text>
          </m-column>
          <m-row justify="between" gap="sm">
            <m-text variant="heading">{{ t(icon.label) }}</m-text>
            <m-icon v-if="selected === icon.id" name="check" tone="primary" />
          </m-row>
          <m-button
            :disabled="!available || selected === icon.id || Boolean(pending)"
            :loading="pending === icon.id"
            :loadingText="t('Alterando…')"
            @click="choose(icon.id)"
          >
            {{ t(selected === icon.id ? 'Em uso' : 'Escolher ícone') }}
          </m-button>
        </m-card>
      </m-stack>
      <m-alert v-if="error" tone="error" :title="t('Não foi desta vez')" :description="t(error)" />
      <m-text variant="caption" tone="muted">{{
        t(
          'Os três ícones já fazem parte deste aplicativo. O sistema pode pedir confirmação e levar alguns instantes para atualizar a tela inicial.',
        )
      }}</m-text>
      <m-button
        variant="ghost"
        :disabled="!available || Boolean(pending) || selected === 'mavis'"
        @click="choose('mavis')"
        >{{ t('Restaurar Mavis') }}</m-button
      >
    </m-column>
  </m-screen>
</template>
