<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const take = ref(0),
  replay = ref(0),
  letters = ref(false),
  animated = ref(true)
const phrase = computed(() =>
  t(
    ['Make room for wonder.', 'Follow the unexpected.', 'Let curiosity lead.'][take.value % 3]!,
    ['Abra espaço para o encanto.', 'Siga o inesperado.', 'Deixe a curiosidade guiar.'][
      take.value % 3
    ]!,
  ),
)
</script>
<template>
  <MColumn gap="lg">
    <MText text="WORDS / IN MOTION" variant="overline" tone="primary" />
    <MCard gap="lg" padding="lg"
      ><MText :text="`0${take + 1}`" variant="caption" tone="muted" /><MAnimatedText
        id="animated-phrase"
        :text="phrase"
        variant="display"
        :by="letters ? 'letter' : 'word'"
        :replayKey="replay"
        :animated="animated"
        :stagger="letters ? 18 : 65" /><MText
        :text="
          t('A little movement. A different feeling.', 'Um pouco de movimento. Outra sensação.')
        "
        tone="muted"
    /></MCard>
    <MRow gap="sm" wrap
      ><MButton :text="t('Next phrase', 'Próxima frase')" @click="take++" /><MButton
        :text="t('Replay', 'Repetir')"
        variant="secondary"
        @click="replay++"
    /></MRow>
    <MRow gap="md" wrap
      ><MSwitch v-model="letters" :label="t('Animate letters', 'Animar letras')" /><MSwitch
        v-model="animated"
        :label="t('Animation enabled', 'Animação habilitada')"
    /></MRow>
  </MColumn>
</template>
