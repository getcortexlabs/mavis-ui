<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, nextTick, reactive, ref } from 'vue'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
import type { InputHandle, ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t, choices } = useCatalogLocale()

const { navigation } = useCatalog()
const { theme } = useMavisTheme()
const interests: ChoiceOption[] = [
  { value: 'design', label: 'Design', helperText: 'Ideias que ganham forma.' },
  { value: 'photography', label: 'Fotografia', helperText: 'Histórias contadas pela luz.' },
  { value: 'architecture', label: 'Arquitetura', helperText: 'Lugares para viver melhor.' },
  { value: 'film', label: 'Cinema', helperText: 'Disponível em breve.', disabled: true },
]
const original = {
  interest: 'design' as ChoiceValue | null,
  notifications: true,
  digest: false,
  name: 'Marina Costa',
  email: 'marina@exemplo.com',
  bio: 'Encontro beleza nas pequenas coisas.\nDesign, fotografia e dias de sol.',
}
const saved = ref({ ...original })
const profile = reactive({ ...original })
const nameInput = ref<InputHandle>()
const emailInput = ref<InputHandle>()
const bioInput = ref<InputHandle>()
const attempted = ref(false)
const toast = useToast()
const discardOpen = ref(false)
const nameError = computed(() =>
  attempted.value && !profile.name.trim() ? 'Conte para nós o seu nome.' : '',
)
const emailError = computed(() =>
  attempted.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
    ? 'Use um e-mail como voce@exemplo.com.'
    : '',
)
const dirty = computed(() =>
  Object.keys(original).some(
    (key) => profile[key as keyof typeof original] !== saved.value[key as keyof typeof original],
  ),
)

async function save() {
  attempted.value = true
  toast.clear()
  await nextTick()
  if (nameError.value) {
    nameInput.value?.focus()
    return
  }
  if (emailError.value) {
    emailInput.value?.focus()
    return
  }
  nameInput.value?.blur()
  emailInput.value?.blur()
  bioInput.value?.blur()
  saved.value = { ...profile }
  toast.show({
    title: t('Tudo com a sua cara.'),
    message: t('Perfil salvo nesta demonstração.'),
    tone: 'success',
  })
}

function discard() {
  discardOpen.value = false
  Object.assign(profile, saved.value)
  attempted.value = false
  toast.clear()
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg" class="showcase-container profile-container">
      <m-row justify="between" gap="sm">
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')">{{
          t('← Showcase')
        }}</m-button>
        <ThemeSwitch />
      </m-row>
      <m-column gap="sm">
        <m-text variant="overline" tone="primary">{{ t('SEU PERFIL') }}</m-text>
        <m-text as="h1" variant="title">{{ t('Do seu jeito.') }}</m-text>
        <m-text tone="muted">{{ t('Um pequeno espaço para mostrar quem você é.') }}</m-text>
      </m-column>
      <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.accentSoft">
        <m-row justify="between" gap="md">
          <m-avatar :name="profile.name" size="lg" :accessibilityHidden="true" />
          <m-badge :text="t('Criativo por natureza')" tone="accent" />
        </m-row>
        <m-column gap="xs">
          <m-text variant="title">{{ t(profile.name.trim() || 'Seu nome aqui') }}</m-text>
          <m-text tone="accent">{{ t('@marina · São Paulo, BR') }}</m-text>
        </m-column>
        <m-box :height="1" :backgroundColor="theme.colors.accent" :style="{ opacity: 0.2 }" />
        <m-text>{{ t(profile.bio || 'Sua próxima história começa aqui.') }}</m-text>
      </m-column>
      <m-card gap="lg">
        <m-row justify="between" gap="sm">
          <m-text as="h2" variant="heading">{{ t('Seus detalhes') }}</m-text>
          <m-badge
            :text="t(dirty ? 'Editando' : 'Em dia')"
            :tone="dirty ? 'primary' : 'success'"
            size="sm"
          />
        </m-row>
        <m-input
          ref="nameInput"
          v-model="profile.name"
          :label="t('Nome completo')"
          :placeholder="t('Seu nome')"
          autocapitalize="words"
          returnKey="next"
          :maxLength="60"
          :error="t(nameError)"
          @submit="emailInput?.focus()"
          @update:modelValue="toast.clear()"
        />
        <m-input
          ref="emailInput"
          v-model="profile.email"
          :label="t('E-mail')"
          type="email"
          returnKey="next"
          :helperText="t('Este endereço não aparece no seu perfil.')"
          :error="t(emailError)"
          @submit="bioInput?.focus()"
          @update:modelValue="toast.clear()"
        />
        <m-select
          v-model="profile.interest"
          :options="choices(interests)"
          :label="t('Seu universo')"
          :placeholder="t('Escolha um interesse')"
          :helperText="t('O ponto de partida para as suas descobertas.')"
          :closeLabel="t('Fechar')"
          :emptyText="t('Nenhum interesse disponível')"
          @update:modelValue="toast.clear()"
        />
        <m-input
          ref="bioInput"
          v-model="profile.bio"
          :label="t('Sobre você')"
          :placeholder="t('O que move você?')"
          multiline
          :rows="3"
          :maxLength="160"
          :helperText="`${profile.bio.length}/160 · ${t('Algumas palavras bastam.')}`"
          @update:modelValue="toast.clear()"
        />
      </m-card>
      <m-card gap="sm">
        <m-row gap="sm">
          <m-icon name="bell" tone="primary" />
          <m-text as="h2" variant="heading">{{ t('No seu ritmo') }}</m-text>
        </m-row>
        <m-switch
          v-model="profile.notifications"
          :label="t('Notificações')"
          :helperText="t('Novidades das pessoas que você acompanha.')"
          @update:modelValue="toast.clear()"
        />
        <m-box :height="1" :backgroundColor="theme.colors.border" />
        <m-switch
          v-model="profile.digest"
          :label="t('Resumo semanal por e-mail')"
          :helperText="t('Uma seleção para ler com calma.')"
          @update:modelValue="toast.clear()"
        />
      </m-card>

      <m-column gap="sm">
        <m-button @click="save">{{ t('Salvar alterações') }}</m-button>
        <m-button v-if="dirty" variant="ghost" @click="discardOpen = true">{{
          t('Descartar alterações')
        }}</m-button>
        <m-text variant="caption" tone="muted" align="center">{{
          t('Demonstração local. Os dados são reiniciados ao sair da tela.')
        }}</m-text>
      </m-column>
    </m-column>
    <m-dialog
      v-model:open="discardOpen"
      :title="t('Descartar suas alterações?')"
      :description="t('Seu perfil voltará à última versão salva nesta demonstração.')"
      tone="danger"
      confirmLabel="Descartar"
      cancelLabel="Continuar editando"
      @confirm="discard"
    />
    <m-toast :controller="toast" :closeLabel="t('Fechar aviso')" />
  </m-screen>
</template>
