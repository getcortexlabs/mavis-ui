<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import type { InputHandle, ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

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
const success = ref(false)
const nameError = computed(() =>
  attempted.value && !profile.name.trim() ? 'Conte para nós o seu nome.' : '',
)
const emailError = computed(() =>
  attempted.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
    ? 'Use um e-mail como voce@exemplo.com.'
    : '',
)
const initials = computed(
  () =>
    profile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toLocaleUpperCase() || 'MC',
)
const dirty = computed(() =>
  Object.keys(original).some(
    (key) => profile[key as keyof typeof original] !== saved.value[key as keyof typeof original],
  ),
)

async function save() {
  attempted.value = true
  success.value = false
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
  success.value = true
}

function discard() {
  Object.assign(profile, saved.value)
  attempted.value = false
  success.value = false
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg" class="showcase-container profile-container">
      <m-row justify="between" gap="sm">
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <ThemeSwitch />
      </m-row>
      <m-column gap="sm">
        <m-text variant="overline" tone="primary">SEU PERFIL</m-text>
        <m-text as="h1" variant="title">Do seu jeito.</m-text>
        <m-text tone="muted">Um pequeno espaço para mostrar quem você é.</m-text>
      </m-column>
      <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.accentSoft">
        <m-row justify="between" gap="md">
          <m-column
            :width="72"
            :shrink="0"
            :height="72"
            radius="full"
            align="center"
            justify="center"
            :backgroundColor="theme.colors.accent"
            :accessibilityHidden="true"
          >
            <m-text variant="heading" tone="onAccent">{{ initials }}</m-text>
          </m-column>
          <m-column
            paddingX="md"
            paddingY="sm"
            radius="full"
            :backgroundColor="theme.colors.surface"
          >
            <m-text variant="caption" tone="accent">✦ Criativo por natureza</m-text>
          </m-column>
        </m-row>
        <m-column gap="xs">
          <m-text variant="title">{{ profile.name.trim() || 'Seu nome aqui' }}</m-text>
          <m-text tone="accent">@marina · São Paulo, BR</m-text>
        </m-column>
        <m-box :height="1" :backgroundColor="theme.colors.accent" :style="{ opacity: 0.2 }" />
        <m-text>{{ profile.bio || 'Sua próxima história começa aqui.' }}</m-text>
      </m-column>
      <m-card gap="lg">
        <m-row justify="between" gap="sm">
          <m-text as="h2" variant="heading">Seus detalhes</m-text>
          <m-text variant="caption" :tone="dirty ? 'primary' : 'muted'">{{
            dirty ? 'Editando' : 'Em dia'
          }}</m-text>
        </m-row>
        <m-input
          ref="nameInput"
          v-model="profile.name"
          label="Nome completo"
          placeholder="Seu nome"
          autocapitalize="words"
          returnKey="next"
          :maxLength="60"
          :error="nameError"
          @submit="emailInput?.focus()"
          @update:modelValue="success = false"
        />
        <m-input
          ref="emailInput"
          v-model="profile.email"
          label="E-mail"
          type="email"
          returnKey="next"
          helperText="Este endereço não aparece no seu perfil."
          :error="emailError"
          @submit="bioInput?.focus()"
          @update:modelValue="success = false"
        />
        <m-select
          v-model="profile.interest"
          :options="interests"
          label="Seu universo"
          placeholder="Escolha um interesse"
          helperText="O ponto de partida para as suas descobertas."
          closeLabel="Fechar"
          emptyText="Nenhum interesse disponível"
          @update:modelValue="success = false"
        />
        <m-input
          ref="bioInput"
          v-model="profile.bio"
          label="Sobre você"
          placeholder="O que move você?"
          multiline
          :rows="3"
          :maxLength="160"
          :helperText="`${profile.bio.length}/160 · Algumas palavras bastam.`"
          @update:modelValue="success = false"
        />
      </m-card>
      <m-card gap="sm">
        <m-row gap="sm">
          <m-icon name="bell" tone="primary" />
          <m-text as="h2" variant="heading">No seu ritmo</m-text>
        </m-row>
        <m-switch
          v-model="profile.notifications"
          label="Notificações"
          helperText="Novidades das pessoas que você acompanha."
          @update:modelValue="success = false"
        />
        <m-box :height="1" :backgroundColor="theme.colors.border" />
        <m-switch
          v-model="profile.digest"
          label="Resumo semanal por e-mail"
          helperText="Uma seleção para ler com calma."
          @update:modelValue="success = false"
        />
      </m-card>
      <m-reveal
        :show="success"
        padding="md"
        radius="md"
        gap="xs"
        :backgroundColor="theme.colors.primarySoft"
      >
        <m-text tone="primary" variant="heading">Tudo com a sua cara.</m-text>
        <m-text tone="primary" variant="caption">Perfil salvo nesta demonstração.</m-text>
      </m-reveal>
      <m-column gap="sm">
        <m-button @click="save">Salvar alterações</m-button>
        <m-button v-if="dirty" variant="ghost" @click="discard">Descartar alterações</m-button>
        <m-text variant="caption" tone="muted" align="center"
          >Demonstração local. Os dados são reiniciados ao sair da tela.</m-text
        >
      </m-column>
    </m-column>
  </m-screen>
</template>
