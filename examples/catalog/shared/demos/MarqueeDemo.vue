<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const paused = ref(false),
  autoplay = ref(false),
  speed = ref(35)
const direction = ref<'left' | 'right'>('left')
const items = computed(() => [
  { id: 'wander', label: t('Wander often.', 'Explore sempre.') },
  { id: 'notice', label: t('Notice the details.', 'Perceba os detalhes.') },
  { id: 'wonder', label: t('Stay curious.', 'Siga curioso.') },
  { id: 'create', label: t('Make something.', 'Crie algo.') },
])
</script>
<template>
  <MColumn gap="lg"
    ><MText text="COMMON GROUND / IDEAS IN MOTION" variant="overline" tone="primary" /><MText
      :text="t('A few words to live by.', 'Algumas palavras para levar.')"
      variant="display" /><MMarquee
      id="reminder-marquee"
      v-model:paused="paused"
      :items="items"
      :autoplay="autoplay"
      :speed="speed"
      :direction="direction"
      :label="t('Small reminders', 'Pequenos lembretes')"
      :playLabel="t('Play motion', 'Iniciar movimento')"
      :pauseLabel="t('Pause motion', 'Pausar movimento')" /><MCard gap="md"
      ><MSlider v-model="speed" :min="15" :max="100" :label="t('Speed', 'Velocidade')" /><MSwitch
        v-model="autoplay"
        :label="t('Start automatically', 'Iniciar automaticamente')" /><MButton
        :text="t('Reverse direction', 'Inverter direção')"
        variant="secondary"
        @click="direction = direction === 'left' ? 'right' : 'left'" /><MText
        :text="
          t(
            'Motion is optional. Hover or focus the strip to pause it.',
            'Movimento é opcional. Passe o cursor ou foque a faixa para pausar.',
          )
        "
        tone="muted" /></MCard
  ></MColumn>
</template>
