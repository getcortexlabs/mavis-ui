<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const trigger = ref(0),
  count = ref(70),
  disabled = ref(false),
  status = ref('')
function celebrate() {
  trigger.value++
  status.value = t('Published. You made it.', 'Publicado. Você conseguiu.')
}
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FORMA STUDIO / THE FINISHING TOUCH" variant="overline" tone="primary" /><MConfetti
      id="studio-confetti"
      :trigger="trigger"
      :count="count"
      :disabled="disabled"
      ><MCard padding="xl" gap="lg"
        ><MBadge :text="t('READY FOR THE WORLD', 'PRONTO PARA O MUNDO')" /><MText
          :text="
            t('The work is done. Take a moment.', 'O trabalho está pronto. Aproveite o momento.')
          "
          variant="title" /><MText
          :text="
            t(
              'A small celebration for a real accomplishment.',
              'Uma pequena celebração para uma conquista de verdade.',
            )
          "
          tone="muted" /><MButton
          :text="t('Publish the project', 'Publicar o projeto')"
          @click="celebrate" /><MText
          id="confetti-status"
          :text="status"
          variant="heading" /></MCard></MConfetti
    ><MText
      :text="`${t('Confetti pieces', 'Quantidade de confetes')}: ${count}`"
      variant="caption" /><MSlider
      v-model="count"
      :min="10"
      :max="180"
      :step="10"
      :label="t('Confetti pieces', 'Quantidade de confetes')" /><MSwitch
      v-model="disabled"
      :label="t('Disable celebration', 'Desativar celebração')"
  /></MColumn>
</template>
