<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const color = ref('#9C5270CC')
const animated = ref(true),
  disabled = ref(false)
</script>
<template>
  <MColumn gap="lg">
    <MText text="CHROMA / PERSONAL STUDIO" variant="overline" tone="primary" />
    <MStack direction="column" :responsive="{ at: 800, direction: 'row' }" gap="lg" align="stretch">
      <MCard :grow="1" padding="lg"
        ><MColorPicker
          v-model="color"
          :label="t('Find your signature.', 'Encontre sua assinatura.')"
          alpha
          :animated="animated"
          :disabled="disabled"
          :colorLabel="t('HEX or RGB', 'HEX ou RGB')"
          :hueLabel="t('Hue', 'Matiz')"
          :saturationLabel="t('Saturation', 'Saturação')"
          :brightnessLabel="t('Brightness', 'Brilho')"
          :alphaLabel="t('Opacity', 'Opacidade')"
          :paletteLabel="t('Palette', 'Paleta')"
          :invalidLabel="t('Enter a valid HEX or RGB color.', 'Digite uma cor HEX ou RGB válida.')"
      /></MCard>
      <MCard :grow="1" padding="lg" gap="lg"
        ><MText text="YOUR NEXT CHAPTER" variant="overline" /><MBox
          :backgroundColor="color"
          :height="180"
          radius="lg" /><MText
          :text="t('Color changes everything.', 'A cor muda tudo.')"
          variant="title" /><MText id="color-value" :text="color" /><MText
          :text="
            t(
              'A palette to call your own. Keep the color, change the feeling.',
              'Uma paleta para chamar de sua. Guarde a cor, mude a sensação.',
            )
          "
          tone="muted"
      /></MCard> </MStack
    ><MRow gap="md" wrap
      ><MSwitch v-model="animated" :label="t('Animate preview', 'Animar prévia')" /><MSwitch
        v-model="disabled"
        :label="t('Disable picker', 'Desabilitar seletor')"
    /></MRow>
  </MColumn>
</template>
