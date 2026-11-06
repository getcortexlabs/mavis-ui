<script setup lang="ts">
import { computed, ref } from 'vue'
import { mountains } from '../atlas/photos'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const large = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MText text="FIELD NOTES / 01" variant="overline" tone="primary" />
    <MCollapsibleHeader
      :title="t('Above the everyday.', 'Acima da rotina.')"
      :subtitle="t('A slower kind of escape', 'Uma pausa em outro ritmo')"
      :image="mountains"
      :height="560"
      :expandedHeight="large ? 310 : 240"
      :sectionHeight="48"
      :topLabel="t('Back to top', 'Voltar ao topo')"
    >
      <template #section
        ><MRow paddingX="md" align="center" justify="between"
          ><MText :text="t('THE ITINERARY', 'O ROTEIRO')" variant="overline" /><MBadge
            text="06" /></MRow
      ></template>
      <MColumn padding="lg" gap="lg">
        <MText
          :text="t('Less rush. More horizon.', 'Menos pressa. Mais horizonte.')"
          variant="heading"
        />
        <MCard v-for="n in 6" :key="n" gap="sm">
          <MText :text="`0${n} / ${t('EXPLORE', 'EXPLORAR')}`" variant="overline" tone="primary" />
          <MText
            :text="
              t(
                [
                  'First light',
                  'The hidden trail',
                  'Lunch with a view',
                  'An afternoon outside',
                  'The blue hour',
                  'A place to return',
                ][n - 1]!,
                [
                  'Primeira luz',
                  'A trilha escondida',
                  'Almoço com vista',
                  'Uma tarde lá fora',
                  'A hora azul',
                  'Um lugar para voltar',
                ][n - 1]!,
              )
            "
            variant="heading"
          />
          <MText
            :text="
              t(
                'Leave a little room for whatever the day brings.',
                'Deixe um espaço para o que o dia trouxer.',
              )
            "
            tone="muted"
          />
        </MCard>
      </MColumn>
    </MCollapsibleHeader>
    <MButton
      :text="t('Change header size', 'Mudar tamanho do cabeçalho')"
      variant="secondary"
      @click="large = !large"
    />
  </MColumn>
</template>
