<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AccordionItem, ChoiceValue } from '@getcortexlabs/mavis-core'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const expanded = ref<ChoiceValue[]>(['start'])
const multiple = ref(false)
const disabled = ref(false)
const helpful = ref(false)
const items = computed<AccordionItem[]>(() => [
  {
    value: 'start',
    title: pt.value ? 'Por onde eu começo?' : 'Where do I start?',
    description: pt.value ? 'Seu primeiro passo, sem complicar.' : 'A simple first step.',
    icon: 'sparkles',
  },
  {
    value: 'theme',
    title: pt.value ? 'Posso mudar o visual?' : 'Can I change the look?',
    icon: 'palette',
  },
  {
    value: 'offline',
    title: pt.value ? 'E quando eu ficar offline?' : 'What about going offline?',
    icon: 'download',
  },
  {
    value: 'soon',
    title: pt.value ? 'O que vem depois?' : 'What comes next?',
    description: pt.value
      ? 'Esta seção ainda não está disponível.'
      : 'This section is not available yet.',
    disabled: true,
  },
])
const answers = computed<Record<string, string>>(() =>
  pt.value
    ? {
        start:
          'Escolha uma ideia pequena e dê forma a ela. Você pode ajustar cada detalhe ao longo do caminho.',
        theme:
          'Os componentes acompanham a paleta e a tipografia do tema. Experimente a troca de tema no topo desta página.',
        offline:
          'O app decide quais dados ficam no dispositivo. O Accordion apenas organiza as respostas na tela.',
      }
    : {
        start: 'Choose a small idea and give it shape. You can refine each detail along the way.',
        theme:
          'Components follow the theme palette and typography. Try the theme switch at the top of this page.',
        offline:
          'The app decides which data stays on the device. Accordion simply organizes the answers on screen.',
      },
)
function setMultiple(value: boolean) {
  if (!value) expanded.value = expanded.value.slice(0, 1)
  multiple.value = value
}
</script>
<template>
  <m-column id="accordion-demo" gap="lg">
    <m-column gap="sm">
      <m-text variant="overline" tone="primary">{{
        pt ? 'ESPAÇO PARA DESCOBRIR' : 'ROOM TO DISCOVER'
      }}</m-text>
      <m-text variant="title">{{
        pt ? 'Uma pergunta abre caminhos.' : 'A question opens possibilities.'
      }}</m-text>
      <m-text tone="muted">{{
        pt
          ? 'Encontre uma resposta. Explore a próxima quando quiser.'
          : 'Find an answer. Explore the next one when you are ready.'
      }}</m-text>
    </m-column>
    <m-accordion
      v-model="expanded"
      :items="items"
      :multiple="multiple"
      :disabled="disabled"
      :label="pt ? 'Perguntas frequentes' : 'Frequently asked questions'"
      :expandedLabel="pt ? 'Expandido' : 'Expanded'"
      :collapsedLabel="pt ? 'Recolhido' : 'Collapsed'"
    >
      <template #default="{ item }">
        <m-column gap="md">
          <m-text>{{ answers[item.value] }}</m-text>
          <m-button
            v-if="item.value === 'start'"
            variant="secondary"
            size="sm"
            @click="helpful = !helpful"
            >{{
              helpful
                ? pt
                  ? 'Obrigado pelo retorno'
                  : 'Thanks for the feedback'
                : pt
                  ? 'Foi útil'
                  : 'Helpful'
            }}</m-button
          >
        </m-column>
      </template>
    </m-accordion>
    <m-switch
      :modelValue="multiple"
      :label="pt ? 'Várias seções abertas' : 'Multiple open sections'"
      @update:modelValue="setMultiple"
    />
    <m-switch v-model="disabled" :label="pt ? 'Bloquear cabeçalhos' : 'Disable headers'" />
  </m-column>
</template>
