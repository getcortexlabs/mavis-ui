<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const value = ref(72),
  semi = ref(true),
  animated = ref(true),
  animateNumber = ref(true)
</script>
<template>
  <MColumn gap="lg"
    ><MText text="PULSE / A LITTLE PROGRESS" variant="overline" tone="primary" /><MCard
      padding="lg"
      gap="lg"
      ><MText
        :text="t('Make space for what matters.', 'Abra espaço para o que importa.')"
        variant="title" /><MGauge
        id="balance-gauge"
        :value="value"
        :label="t('Weekly balance', 'Equilíbrio da semana')"
        suffix="%"
        :semi="semi"
        :animated="animated"
        :animateNumber="animateNumber" /><MSlider
        v-model="value"
        :label="t('Balance', 'Equilíbrio')" /><MRow gap="sm" wrap
        ><MButton
          :text="t('Slow day', 'Dia tranquilo')"
          variant="secondary"
          @click="value = 24" /><MButton
          :text="t('In the flow', 'No ritmo')"
          @click="value = 92" /></MRow></MCard
    ><MRow gap="md" wrap
      ><MSwitch v-model="semi" :label="t('Half circle', 'Semicírculo')" /><MSwitch
        v-model="animated"
        :label="t('Animate arc', 'Animar arco')" /><MSwitch
        v-model="animateNumber"
        :label="t('Animate number', 'Animar número')" /></MRow
  ></MColumn>
</template>
