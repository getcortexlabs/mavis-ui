<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const { theme } = useMavisTheme()
const toast = useToast()
const open = ref(false)
const danger = ref(false)
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
function show(destructive: boolean) {
  danger.value = destructive
  open.value = true
}
function confirm() {
  loading.value = true
  timer = setTimeout(() => {
    loading.value = false
    open.value = false
    toast.show({
      title: pt.value ? 'Tudo certo.' : 'All done.',
      message: pt.value ? 'Ação concluída nesta demonstração.' : 'Action completed in this demo.',
      tone: 'success',
    })
  }, 1200)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-row justify="between" gap="sm">
        <m-text variant="overline" tone="primary">{{
          pt ? 'ANTES DO PRÓXIMO PASSO' : 'BEFORE THE NEXT STEP'
        }}</m-text>
        <m-icon name="sparkles" tone="primary" />
      </m-row>
      <m-text variant="title">{{ pt ? 'Vale uma pausa.' : 'A moment to decide.' }}</m-text>
      <m-text tone="muted">{{
        pt
          ? 'Algumas decisões merecem a sua atenção. Duas escolhas claras, no centro da tela.'
          : 'Some decisions deserve your attention. Two clear choices, at the center of the screen.'
      }}</m-text>
      <m-column padding="md" gap="md" radius="md" :backgroundColor="theme.colors.surface">
        <m-row gap="sm"
          ><m-icon name="circle-check" tone="primary" /><m-text :style="{ fontWeight: '600' }">{{
            pt ? 'Pronto para publicar?' : 'Ready to publish?'
          }}</m-text></m-row
        >
        <m-text variant="caption" tone="muted">{{
          pt
            ? 'Sua coleção, pronta para ganhar o mundo.'
            : 'Your collection, ready to meet the world.'
        }}</m-text>
        <m-button @click="show(false)">{{
          pt ? 'Publicar coleção' : 'Publish collection'
        }}</m-button>
      </m-column>
    </m-column>
    <m-card gap="md">
      <m-row gap="sm"
        ><m-icon name="triangle-alert" tone="danger" /><m-text variant="heading">{{
          pt ? 'Com cuidado.' : 'With care.'
        }}</m-text></m-row
      >
      <m-text tone="muted">{{
        pt
          ? 'Quando não dá para voltar atrás, a consequência precisa ficar clara.'
          : 'When a choice cannot be undone, make the consequence clear.'
      }}</m-text>
      <m-button variant="secondary" @click="show(true)">{{
        pt ? 'Excluir coleção' : 'Delete collection'
      }}</m-button>
    </m-card>
    <m-text variant="caption" tone="muted">{{
      pt
        ? 'Demonstração local. Nenhuma coleção será publicada ou excluída.'
        : 'Local demo. No collection will be published or deleted.'
    }}</m-text>
    <m-dialog
      v-model:open="open"
      :loading="loading"
      :tone="danger ? 'danger' : 'default'"
      :title="
        danger
          ? pt
            ? 'Excluir esta coleção?'
            : 'Delete this collection?'
          : pt
            ? 'Compartilhar sua coleção?'
            : 'Share your collection?'
      "
      :description="
        danger
          ? pt
            ? 'As fotos e anotações desta coleção serão removidas. Esta ação não pode ser desfeita.'
            : 'The photos and notes in this collection will be removed. This cannot be undone.'
          : pt
            ? 'As pessoas que acompanham você poderão ver as fotos e deixar comentários.'
            : 'People who follow you will be able to see the photos and leave comments.'
      "
      :confirmLabel="danger ? (pt ? 'Excluir' : 'Delete') : pt ? 'Publicar' : 'Publish'"
      :cancelLabel="pt ? 'Agora não' : 'Not now'"
      :loadingLabel="pt ? 'Aguarde…' : 'Please wait…'"
      @confirm="confirm"
    />
    <m-toast :controller="toast" :closeLabel="pt ? 'Fechar aviso' : 'Dismiss notice'" />
  </m-column>
</template>
