<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'
import AuthForm from '../auth/AuthForm.vue'
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
    title: `Welcome, ${name}.`,
    message: 'Your next chapter starts here.',
    tone: 'success',
  })
  navigation.push('/showcase/morrow/home')
}
function recover() {
  toast.show({
    title: 'You’re all set.',
    message: 'Recovery preview complete. No email was sent.',
    tone: 'info',
  })
  recovery.value = false
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="xl" class="morrow-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <ThemeSwitch />
      </m-row>
      <m-row gap="xl" align="stretch" wrap>
        <m-card :width="280" :grow="1" padding="lg" gap="lg" elevation="sm">
          <m-column gap="sm">
            <m-text variant="overline" tone="primary">YOU BELONG HERE</m-text>
            <m-text variant="title">Come on in.</m-text>
            <m-text tone="muted">Pick up where you left off, or start something new.</m-text>
          </m-column>
          <m-tabs v-model="tab" :tabs="tabs" label="Your account" keepAlive>
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
          :width="280"
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
            <m-text variant="heading" tone="accent">morrow</m-text>
          </m-row>
          <m-column gap="md" paddingY="lg">
            <m-text variant="overline" tone="accent">MAKE ROOM FOR WHAT’S NEXT</m-text>
            <m-text as="h1" variant="display">A little space. A bigger tomorrow.</m-text>
            <m-text tone="muted"
              >Your ideas, your people, your next good thing. All together, in a place that feels
              like you.</m-text
            >
          </m-column>
          <m-column gap="md" padding="lg" radius="lg" :backgroundColor="theme.colors.surface">
            <m-row justify="between" gap="md">
              <m-badge text="A fresh start" tone="primary" />
              <m-icon name="sparkles" tone="accent" />
            </m-row>
            <m-text variant="title">Good things grow here.</m-text>
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
            <m-text variant="caption" tone="muted"
              >One small step. Something worth starting.</m-text
            >
          </m-column>
          <m-text variant="caption" tone="accent">YOUR PACE. YOUR POSSIBILITIES.</m-text>
        </m-column>
      </m-row>
      <m-sheet v-model:open="recovery" title="A way back in" closeLabel="Close recovery">
        <m-text tone="muted">Try the recovery flow, then return to your space.</m-text>
        <m-input
          v-model="email"
          label="Recovery email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
        />
        <m-button @click="recover">Preview recovery</m-button>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
