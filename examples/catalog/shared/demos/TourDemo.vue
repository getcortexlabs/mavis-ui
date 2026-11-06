<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const step = ref<string | null>(null),
  draft = ref('Weekend away'),
  finished = ref('')
const steps = computed(() => [
  {
    id: 'name',
    title: t('Give it a name.', 'Dê um nome.'),
    description: t(
      'Your next story begins with a few words. Your draft stays right here.',
      'Sua próxima história começa com algumas palavras. Seu rascunho fica aqui.',
    ),
  },
  {
    id: 'route',
    title: t('Choose the unexpected.', 'Escolha o inesperado.'),
    description: t(
      'Collect the places you want to discover along the way.',
      'Guarde os lugares que você quer descobrir pelo caminho.',
    ),
  },
  {
    id: 'invite',
    title: t('Good company, great stories.', 'Boa companhia, grandes histórias.'),
    description: t(
      'Bring someone along. You are ready to begin.',
      'Leve alguém com você. Está tudo pronto para começar.',
    ),
  },
])
function start() {
  step.value = 'name'
  finished.value = ''
}
</script>
<template>
  <MColumn gap="lg"
    ><MText text="FIRST STEPS / A WARM WELCOME" variant="overline" tone="primary" /><MButton
      id="tour-start"
      :text="t('Show me around', 'Me mostre por aqui')"
      @click="start" /><MTour
      v-model="step"
      :steps="steps"
      :label="t('A new adventure', 'Uma nova aventura')"
      :nextLabel="t('Next', 'Próximo')"
      :backLabel="t('Back', 'Voltar')"
      :skipLabel="t('End tour', 'Encerrar tour')"
      :finishLabel="t('Finish', 'Concluir')"
      @finish="finished = $event"
      ><MColumn gap="lg"
        ><MTourTarget name="name"
          ><MCard gap="md"
            ><MText
              :text="t('Your little escape.', 'Sua pequena escapada.')"
              variant="title" /><MInput
              v-model="draft"
              :label="t('Trip name', 'Nome da viagem')" /></MCard></MTourTarget
        ><MTourTarget name="route"
          ><MCard gap="md"
            ><MText
              :text="t('A trail worth following.', 'Uma trilha que vale seguir.')"
              variant="heading" /><MText
              :text="
                t(
                  'Three days. A different pace. Room for detours.',
                  'Três dias. Outro ritmo. Espaço para desvios.',
                )
              " /><MButton
              :text="t('Explore routes', 'Explorar rotas')"
              variant="secondary" /></MCard></MTourTarget
        ><MTourTarget name="invite"
          ><MCard gap="md"
            ><MText :text="t('Better together.', 'Melhor juntos.')" variant="heading" /><MButton
              :text="t('Invite a friend', 'Convidar alguém')"
              icon="plus" /></MCard></MTourTarget></MColumn></MTour
    ><MText id="tour-result" :text="finished || '—'" variant="caption"
  /></MColumn>
</template>
