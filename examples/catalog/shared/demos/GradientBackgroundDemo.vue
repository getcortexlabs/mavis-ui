<script setup lang="ts">
import { computed, ref } from 'vue'
import { midnight } from '@getcortexlabs/mavis-core'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const active = ref(false),
  alternate = ref(false),
  animated = ref(true)
const colors = computed(() =>
  alternate.value ? ['#263848', '#315D64', '#665B46'] : ['#32243C', '#70455E', '#895653'],
)
const draft = ref('')
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FORMA STUDIO / ATMOSPHERE" variant="overline" tone="primary" /><MThemeProvider
      :theme="midnight"
      ><MGradientBackground
        id="studio-gradient"
        :colors="colors"
        :active="active"
        :animated="animated"
        :height="360"
        ><MColumn padding="xl" gap="lg" justify="center" height="100%"
          ><MText text="SOMETHING GOOD IS TAKING SHAPE." variant="overline" /><MText
            :text="t('Make room for the unexpected.', 'Abra espaço para o inesperado.')"
            variant="title" /><MText
            :text="
              t(
                'A little color changes the whole conversation.',
                'Um pouco de cor muda toda a conversa.',
              )
            " /></MColumn
      ></MGradientBackground> </MThemeProvider
    ><MRow gap="md" wrap
      ><MButton
        :text="t('Change atmosphere', 'Mudar atmosfera')"
        @click="alternate = !alternate" /><MSwitch
        v-model="active"
        :label="t('Continuous motion', 'Movimento contínuo')" /><MSwitch
        v-model="animated"
        :label="t('Animate palette', 'Animar paleta')" /></MRow
    ><MInput v-model="draft" :label="t('A thought to keep', 'Uma ideia para guardar')"
  /></MColumn>
</template>
