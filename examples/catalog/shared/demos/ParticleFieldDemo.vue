<script setup lang="ts">
import { computed, ref } from 'vue'
import { midnight } from '@getcortexlabs/mavis-core'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const active = ref(false),
  density = ref(12),
  speed = ref(28)
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FORMA STUDIO / AFTER HOURS" variant="overline" tone="primary" /><MThemeProvider
      :theme="midnight"
      ><MParticleField
        id="studio-particles"
        :active="active"
        :density="density"
        :speed="speed"
        :colors="['#F2CF92', '#91CCC4', '#C4AEDE']"
        :height="340"
        ><MColumn padding="xl" gap="md" justify="center" height="100%"
          ><MText text="THE QUIET BETWEEN IDEAS" variant="overline" /><MText
            :text="t('Leave a little room for wonder.', 'Deixe um pouco de espaço para o encanto.')"
            variant="title" /><MText
            :text="
              t(
                'A decorative layer. Your content stays yours.',
                'Uma camada decorativa. Seu conteúdo continua seu.',
              )
            " /></MColumn
      ></MParticleField> </MThemeProvider
    ><MSwitch v-model="active" :label="t('Play particles', 'Ativar partículas')" /><MText
      :text="`${t('Density', 'Densidade')}: ${density}`"
      variant="caption" /><MSlider
      v-model="density"
      :min="1"
      :max="40"
      :label="t('Density', 'Densidade')" /><MText
      :text="`${t('Speed', 'Velocidade')}: ${speed}`"
      variant="caption" /><MSlider
      v-model="speed"
      :min="0"
      :max="100"
      :label="t('Speed', 'Velocidade')"
  /></MColumn>
</template>
