<script setup lang="ts">
import { avatarImage } from '../assets/avatar-image'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const { theme } = useMavisTheme()
const expanded = ref(false)
const members = computed(() => [
  {
    id: 'marina',
    name: 'Marina Costa',
    role: t('Photo editor', 'Editora de fotografia'),
    src: avatarImage,
  },
  { id: 'aya', name: 'Aya Mori', role: t('Art director', 'Diretora de arte') },
  { id: 'luis', name: 'Luís Reis', role: t('Photographer', 'Fotógrafo') },
  { id: 'iman', name: 'Iman Noor', role: t('Producer', 'Produtora') },
  { id: 'jules', name: 'Jules Park', role: t('Writer', 'Redator') },
])
</script>
<template>
  <MColumn id="avatar-group-preview" :backgroundColor="theme.colors.background" gap="lg">
    <MColumn padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <MColumn gap="xs">
        <MText
          variant="overline"
          tone="primary"
          :text="t('PHOTO DESK', 'EDITORIA DE FOTOGRAFIA')"
        />
        <MText variant="title" :text="t('Behind the edition', 'Quem faz a edição')" />
      </MColumn>
      <MAvatarGroup :members="members" :maxVisible="expanded ? members.length : 3" size="lg" />
    </MColumn>
    <MButton
      variant="secondary"
      :text="
        expanded
          ? t('Hide credits', 'Ocultar créditos')
          : t('Show all 5 credits', 'Ver os 5 créditos')
      "
      @click="expanded = !expanded"
    />
    <MColumn v-if="expanded" gap="md">
      <MRow v-for="person in members" :key="person.id" align="center" gap="md">
        <MAvatar :name="person.name" :src="person.src" size="sm" />
        <MColumn
          ><MText :text="person.name" /><MText tone="muted" variant="caption" :text="person.role"
        /></MColumn>
      </MRow>
    </MColumn>
  </MColumn>
</template>
