<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'
import AuthForm from '../auth/AuthForm.vue'

const { t, choices } = useCatalogLocale()

const { theme } = useMavisTheme()
const { navigation, memberName } = useCatalog()
const toast = useToast({ scope: 'app' })
const tab = ref<ChoiceValue>('login'),
  recovery = ref(false),
  email = ref('')
const tabs = [
  { value: 'login', label: 'Sign in' },
  { value: 'signup', label: 'Create account' },
]
function complete(name: string) {
  memberName.value = name
  toast.show({
    title: `${t('Boas-vindas,')} ${name}.`,
    message: t('Your next chapter starts here.'),
    tone: 'success',
  })
  navigation.push('/showcase/morrow/home')
}
function recover() {
  toast.show({
    title: t('You’re all set.'),
    message: t('Recovery preview complete. No email was sent.'),
    tone: 'info',
  })
  recovery.value = false
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl" class="morrow-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/showcase')">{{
          t('← Showcase')
        }}</m-button>
        <ThemeSwitch />
      </m-row>
      <m-stack gap="lg" align="stretch" :responsive="{ at: 680, direction: 'row', gap: 'xl' }">
        <m-card :width="'auto'" :grow="1" padding="lg" gap="lg" elevation="sm">
          <m-column gap="sm">
            <m-text variant="overline" tone="primary">{{ t('YOU BELONG HERE') }}</m-text>
            <m-text variant="title">{{ t('Come on in.') }}</m-text>
            <m-text tone="muted">{{
              t('Pick up where you left off, or start something new.')
            }}</m-text>
          </m-column>
          <m-tabs v-model="tab" :tabs="choices(tabs)" :label="t('Your account')" keepAlive>
            <template #default="{ value }">
              <AuthForm
                :signup="value === 'signup'"
                @complete="complete"
                @recover="recovery = true"
              />
            </template>
          </m-tabs>
        </m-card>
        <m-column
          :width="'auto'"
          :grow="1"
          padding="lg"
          radius="lg"
          gap="xl"
          :backgroundColor="theme.colors.accentSoft"
        >
          <m-row gap="sm">
            <m-column
              :width="40"
              :height="40"
              radius="md"
              align="center"
              justify="center"
              :backgroundColor="theme.colors.accent"
            >
              <m-icon name="sunrise" :size="24" tone="onAccent" />
            </m-column>
            <m-text variant="heading" tone="accent">{{ t('morrow') }}</m-text>
          </m-row>
          <m-column gap="md" paddingY="lg">
            <m-text variant="overline" tone="accent">{{ t('MAKE ROOM FOR WHAT’S NEXT') }}</m-text>
            <m-text as="h1" variant="display">{{ t('A little space. A bigger tomorrow.') }}</m-text>
            <m-text tone="muted">{{
              t(
                'Your ideas, your people, your next good thing. All together, in a place that feels like you.',
              )
            }}</m-text>
          </m-column>
          <m-column gap="md" padding="lg" radius="lg" :backgroundColor="theme.colors.surface">
            <m-row justify="between" gap="md">
              <m-badge :text="t('A fresh start')" tone="primary" />
              <m-icon name="sparkles" tone="accent" />
            </m-row>
            <m-text variant="title">{{ t('Good things grow here.') }}</m-text>
            <m-row gap="xs" :accessibilityHidden="true">
              <m-box
                v-for="n in 12"
                :key="n"
                :width="0"
                :grow="1"
                :height="n % 3 === 0 ? 64 : n % 2 === 0 ? 48 : 32"
                radius="full"
                :backgroundColor="n % 2 ? theme.colors.primarySoft : theme.colors.accentSoft"
              />
            </m-row>
            <m-text variant="caption" tone="muted">{{
              t('One small step. Something worth starting.')
            }}</m-text>
          </m-column>
          <m-text variant="caption" tone="accent">{{ t('YOUR PACE. YOUR POSSIBILITIES.') }}</m-text>
        </m-column>
      </m-stack>
      <m-sheet
        v-model:open="recovery"
        :title="t('A way back in')"
        :closeLabel="t('Close recovery')"
      >
        <m-text tone="muted">{{ t('Try the recovery flow, then return to your space.') }}</m-text>
        <m-input
          v-model="email"
          :label="t('Recovery email')"
          type="email"
          :placeholder="t('you@example.com')"
          autocomplete="email"
        />
        <m-button @click="recover">{{ t('Preview recovery') }}</m-button>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
