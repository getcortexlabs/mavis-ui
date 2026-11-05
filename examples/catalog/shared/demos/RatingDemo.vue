<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const score = ref(3.5)
</script>

<template>
  <MCard padding="lg" gap="lg">
    <MRow gap="md"
      ><MAvatar name="Marina Costa" size="lg" /><MColumn gap="xs"
        ><MText text="Marina Costa" weight="600" /><MText
          :text="
            t('A thoughtful host, a lovely stay.', 'Uma anfitriã atenciosa. Uma estadia especial.')
          "
          variant="caption"
          tone="muted" /></MColumn
    ></MRow>
    <MSeparator />
    <MRating
      v-model="score"
      :step="0.5"
      :label="t('How was your stay?', 'Como foi sua estadia?')"
    />
    <MRating
      :modelValue="4.5"
      :step="0.5"
      readonly
      :label="t('Guest favorite', 'Favorito dos hóspedes')"
    />
    <MText id="rating-value" :text="String(score)" variant="caption" tone="muted" />
  </MCard>
</template>
