<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { AccordionItem, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t, choices } = useCatalogLocale()

const { theme } = useMavisTheme()
const { navigation } = useCatalog()
type Topic = 'account' | 'billing' | 'app'
type Answer = AccordionItem & { answer: string }
const topic = ref<ChoiceValue | null>('account')
const topics = [
  { value: 'account', label: 'Conta' },
  { value: 'billing', label: 'Planos' },
  { value: 'app', label: 'App' },
]
const questions: Record<Topic, Answer[]> = {
  account: [
    {
      value: 'profile',
      title: 'Como deixo o perfil com a minha cara?',
      icon: 'user',
      answer:
        'Comece pelo nome e pela foto. No Showcase de perfil, você pode experimentar as edições e ver o resultado antes de salvar.',
    },
    {
      value: 'preferences',
      title: 'Minhas preferências ficam salvas?',
      icon: 'sliders-horizontal',
      answer:
        'Nesta demonstração, as escolhas ficam apenas na memória da tela. Um app real decide como salvar e sincronizar essas preferências.',
    },
    {
      value: 'privacy',
      title: 'Quem pode ver meus dados?',
      icon: 'shield-check',
      answer:
        'Esta central não envia informações a um servidor. Em um produto real, os controles de privacidade e a política de dados pertencem ao app.',
    },
  ],
  billing: [
    {
      value: 'plans',
      title: 'Posso experimentar antes de escolher?',
      icon: 'sparkles',
      answer:
        'Pode explorar todos os exemplos do catálogo. Não há plano, assinatura ou cobrança nesta demonstração.',
    },
    {
      value: 'change',
      title: 'E se minhas necessidades mudarem?',
      icon: 'refresh-cw',
      answer:
        'Uma boa experiência permite revisar uma escolha com clareza. O app deve explicar o novo valor e pedir sua confirmação antes de alterar uma assinatura.',
    },
    {
      value: 'receipt',
      title: 'Onde encontro os comprovantes?',
      icon: 'receipt',
      answer:
        'Em um app com pagamentos, os comprovantes precisam estar próximos do histórico de cobranças. Aqui, usamos essa pergunta apenas para demonstrar a composição.',
    },
  ],
  app: [
    {
      value: 'appearance',
      title: 'Como alterno entre claro e escuro?',
      icon: 'palette',
      answer:
        'Use a troca de tema no topo. O controle, as perguntas e os avisos acompanham a mesma paleta, sem perder o estado da tela.',
    },
    {
      value: 'connection',
      title: 'Preciso estar conectado?',
      icon: 'wifi',
      answer:
        'Depois de carregada, esta demonstração funciona com dados locais. Isso não implementa cache offline: em um produto, essa política é definida pelo app.',
    },
    {
      value: 'devices',
      title: 'Posso usar em mais de um dispositivo?',
      icon: 'smartphone',
      answer:
        'A mesma tela Mavis pode ser renderizada no NativeScript e na Web. Conta, autenticação e sincronização entre dispositivos continuam sob responsabilidade do app.',
    },
  ],
}
const active = computed(() => (topic.value ?? 'account') as Topic)
const items = computed(() => questions[active.value])
const expanded = ref<Record<Topic, ChoiceValue[]>>({ account: ['profile'], billing: [], app: [] })
const helpful = ref<string[]>([])
const contact = ref(false)
function thank(value: ChoiceValue) {
  const id = String(value)
  if (!helpful.value.includes(id)) helpful.value.push(id)
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl" class="showcase-container">
      <m-row justify="between" gap="sm"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')">{{
          t('← Showcase')
        }}</m-button
        ><ThemeSwitch
      /></m-row>
      <m-column gap="md">
        <m-row gap="sm"
          ><m-icon name="messages-square" tone="primary" /><m-text
            variant="overline"
            tone="primary"
            >{{ t('CENTRAL DE AJUDA') }}</m-text
          ></m-row
        >
        <m-text as="h1" variant="display">{{ t('Um atalho para continuar.') }}</m-text>
        <m-text tone="muted">{{
          t('As respostas de que você precisa, com espaço para o próximo passo.')
        }}</m-text>
      </m-column>
      <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
        <m-row justify="between" gap="md"
          ><m-badge :text="t('FEITO PARA FACILITAR')" tone="primary" size="sm" /><m-icon
            name="sparkles"
            tone="primary"
        /></m-row>
        <m-text variant="title" tone="primary">{{
          t('Menos dúvidas. Mais possibilidades.')
        }}</m-text>
        <m-row gap="sm"
          ><m-avatar name="Mavis" size="sm" /><m-column :width="0" :grow="1" gap="xs"
            ><m-text>{{ t('Vamos por partes.') }}</m-text
            ><m-text variant="caption" tone="muted">{{
              t('Escolha um assunto para começar.')
            }}</m-text></m-column
          ></m-row
        >
      </m-card>
      <m-column gap="lg">
        <m-segmented-control
          v-model="topic"
          :options="choices(topics)"
          :label="t('Assunto da ajuda')"
        />
        <m-row justify="between" gap="sm"
          ><m-text variant="heading">{{ t('Perguntas frequentes') }}</m-text
          ><m-badge :text="t(items.length)" tone="neutral"
        /></m-row>
        <m-accordion
          v-model="expanded[active]"
          :items="choices(items)"
          multiple
          :label="t('Respostas sobre o assunto')"
          expandedLabel="Expandido"
          collapsedLabel="Recolhido"
        >
          <template #default="{ item }"
            ><m-column gap="md"
              ><m-text>{{ t(items.find((answer) => answer.value === item.value)?.answer) }}</m-text
              ><m-row gap="sm" wrap
                ><m-button
                  size="sm"
                  variant="secondary"
                  :disabled="helpful.includes(String(item.value))"
                  @click="thank(item.value)"
                  >{{
                    t(helpful.includes(String(item.value)) ? 'Obrigado pelo retorno' : 'Foi útil')
                  }}</m-button
                ><m-button
                  v-if="item.value === 'profile'"
                  size="sm"
                  variant="ghost"
                  @click="navigation.push('/showcase/profile')"
                  >{{ t('Explorar perfil ↗') }}</m-button
                ></m-row
              ></m-column
            ></template
          >
        </m-accordion>
      </m-column>
      <m-separator />
      <m-column gap="md"
        ><m-text variant="title">{{ t('Faltou alguma resposta?') }}</m-text
        ><m-text tone="muted">{{ t('Uma boa conversa começa com uma pergunta.') }}</m-text
        ><m-button variant="secondary" @click="contact = !contact">{{
          t('Quero conversar')
        }}</m-button
        ><m-alert
          v-if="contact"
          :title="t('Este é um espaço de demonstração.')"
          :description="
            t(
              'Nenhuma mensagem foi enviada. Em um app real, esta ação pode abrir o canal de atendimento escolhido pelo produto.',
            )
          "
          dismissible
          :closeLabel="t('Fechar informação de atendimento')"
          @close="contact = false"
      /></m-column>
    </m-column>
  </m-screen>
</template>
