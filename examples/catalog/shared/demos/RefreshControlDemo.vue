<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RefreshContext } from '@getcortexlabs/mavis-core'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const edition = ref(1),
  fail = ref(false),
  disabled = ref(false)
async function refresh(context: RefreshContext) {
  const shouldFail = fail.value
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 900)
    context.signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
  if (context.cancelled) return
  if (shouldFail) throw new Error('Offline')
  await context.commit(() => {
    edition.value++
  })
}
</script>
<template>
  <MColumn gap="md">
    <MText text="THE DAILY / A FRESH PERSPECTIVE" variant="overline" tone="primary" />
    <MRefreshControl
      :label="t('Your morning edition', 'Sua edição da manhã')"
      :refresh="refresh"
      :disabled="disabled"
      :refreshLabel="t('Refresh', 'Atualizar')"
      :refreshingLabel="t('Bringing fresh stories…', 'Buscando novas histórias…')"
      :successLabel="t('You are up to date', 'Tudo em dia')"
      :errorLabel="
        t('Offline. Your stories are still here.', 'Sem conexão. Suas histórias continuam aqui.')
      "
      :retryLabel="t('Try again', 'Tentar novamente')"
      :cancelLabel="t('Cancel refresh', 'Cancelar atualização')"
    >
      <MColumn padding="md" gap="md">
        <MText
          id="refresh-edition"
          :text="`${t('Edition', 'Edição')} ${edition}`"
          variant="overline"
          tone="primary"
        />
        <MCard v-for="n in 5" :key="n" gap="sm"
          ><MText
            :text="`${String(n).padStart(2, '0')} / JOURNAL`"
            variant="overline"
            tone="muted" /><MText
            :text="
              t(
                [
                  'A different way to start.',
                  'Small things, noticed.',
                  'Make time for a detour.',
                  'There is more outside.',
                  'Keep your curiosity.',
                ][n - 1]!,
                [
                  'Um começo diferente.',
                  'Os detalhes importam.',
                  'Tempo para um desvio.',
                  'Há mais lá fora.',
                  'Guarde a curiosidade.',
                ][n - 1]!,
              )
            "
            variant="heading"
        /></MCard>
      </MColumn>
    </MRefreshControl>
    <MRow gap="sm" wrap
      ><MSwitch v-model="fail" :label="t('Simulate offline', 'Simular offline')" /><MSwitch
        v-model="disabled"
        :label="t('Pause updates', 'Pausar atualizações')"
    /></MRow>
  </MColumn>
</template>
