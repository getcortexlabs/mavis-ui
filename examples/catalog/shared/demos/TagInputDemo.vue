<script setup lang="ts">
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { coast } from '../atlas/photos'
import { ref } from 'vue'
import { useCatalogLocale } from '../locale'
const { theme } = useMavisTheme()
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const tags = ref(['35mm', 'Costa'])
</script>
<template>
  <MColumn id="tag-input-preview" :backgroundColor="theme.colors.background" gap="lg">
    <MColumn gap="sm">
      <MImage
        :src="coast"
        :height="180"
        radius="lg"
        fit="cover"
        :alt="t('A turquoise shoreline', 'Uma praia de água turquesa')"
      />
      <MText variant="title" :text="t('Atlantic coast', 'Costa atlântica')" />
      <MText
        tone="muted"
        :text="t('Contact sheet · 35 mm film', 'Folha de contato · filme de 35 mm')"
      />
    </MColumn>
    <MTagInput
      v-model="tags"
      :maxTags="8"
      :label="t('Photo tags', 'Tags da foto')"
      :placeholder="t('Add a subject', 'Adicionar assunto')"
      :addLabel="t('Add tag', 'Adicionar tag')"
      :removeLabel="t('Remove', 'Remover')"
    />
    <MRow gap="sm" justify="between" align="center">
      <MText
        :grow="1"
        variant="caption"
        tone="muted"
        :text="t('Separate tags with a comma or Enter.', 'Separe as tags com vírgula ou Enter.')"
      />
      <MBadge :text="tags.length + ' / 8'" />
    </MRow>
  </MColumn>
</template>
