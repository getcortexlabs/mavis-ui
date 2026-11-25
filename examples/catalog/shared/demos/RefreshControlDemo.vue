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
const source = ref(1)
const entries = ref(['1', '2', '3', '4', '5'])
function replaceEdition() {
  source.value++
  edition.value = 1
  entries.value = ['1', '2', '3', '4', '5']
}
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
    entries.value = [String(5 + edition.value), ...entries.value]
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
      :sourceKey="source"
      :itemKeys="entries"
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
      <template #default
        ><MColumn padding="md" gap="md">
          <MText
            id="refresh-edition"
            :text="`${t('Edition', 'Edição')} ${edition}`"
            variant="overline"
            tone="primary"
          /> </MColumn
      ></template>
      <template #item="{ itemKey }"
        ><MColumn padding="sm"
          ><MCard :id="'story-' + itemKey" gap="sm"
            ><MText
              :text="`${itemKey.padStart(2, '0')} / JOURNAL`"
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
                  ][(Number(itemKey) - 1) % 5]!,
                  [
                    'Um começo diferente.',
                    'Os detalhes importam.',
                    'Tempo para um desvio.',
                    'Há mais lá fora.',
                    'Guarde a curiosidade.',
                  ][(Number(itemKey) - 1) % 5]!,
                )
              "
              variant="heading"
          /></MCard> </MColumn
      ></template>
    </MRefreshControl>
    <MButton
      variant="secondary"
      :text="t('Switch edition', 'Trocar edição')"
      @click="replaceEdition"
    />
    <MRow gap="sm" wrap
      ><MSwitch v-model="fail" :label="t('Simulate offline', 'Simular offline')" /><MSwitch
        v-model="disabled"
        :label="t('Pause updates', 'Pausar atualizações')"
    /></MRow>
  </MColumn>
</template>
