<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
const props = defineProps<{ signup: boolean }>()
const emit = defineEmits<{ complete: [name: string]; recover: [] }>()
const { theme } = useMavisTheme()
const name = ref(''),
  email = ref(''),
  password = ref(''),
  reveal = ref(false)
const error = ref(''),
  busy = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const action = computed(() => ({
  icon: reveal.value ? ('eye-off' as const) : ('eye' as const),
  label: reveal.value ? 'Hide password' : 'Show password',
}))
const resetWork = () => {
  clearTimeout(timer)
  busy.value = false
}
onDeactivated(resetWork)
onBeforeUnmount(resetWork)
function submit() {
  if (!email.value.trim() || !password.value) {
    error.value = 'Enter an email and a password to try the preview.'
    return
  }
  error.value = ''
  busy.value = true
  timer = setTimeout(() => {
    busy.value = false
    emit('complete', name.value.trim() || 'Alex')
  }, 550)
}
</script>

<template>
  <m-column gap="lg">
    <m-column gap="md">
      <m-input
        v-if="signup"
        v-model="name"
        label="Your name"
        placeholder="Alex Morgan"
        name="name"
        autocomplete="name"
      />
      <m-input
        v-model="email"
        label="Email"
        placeholder="you@example.com"
        type="email"
        name="email"
        autocomplete="email"
      />
      <m-input
        v-model="password"
        label="Password"
        :type="reveal ? 'text' : 'password'"
        name="password"
        :autocomplete="signup ? 'new-password' : 'current-password'"
        :trailingAction="action"
        @action="reveal = !reveal"
        @submit="submit"
      />
      <m-text v-if="error" tone="danger" variant="caption">{{ error }}</m-text>
    </m-column>
    <m-button :loading="busy" loadingText="Opening your space…" @click="submit">
      {{ signup ? 'Create your space' : 'Welcome back' }}
      <template #trailing><m-icon name="arrow-right" tone="onPrimary" :size="18" /></template>
    </m-button>
    <m-button v-if="!signup" variant="ghost" size="sm" @click="emit('recover')"
      >Forgot your password?</m-button
    >
    <m-separator />
    <m-button variant="secondary" @click="emit('complete', 'Alex')">
      Continue with Studio
      <template #leading>
        <m-column
          :width="24"
          :height="24"
          radius="sm"
          align="center"
          justify="center"
          :backgroundColor="theme.colors.accent"
        >
          <m-icon name="sparkles" :size="16" tone="onAccent" />
        </m-column>
      </template>
      <template #trailing><m-badge text="Demo" tone="accent" size="sm" /></template>
    </m-button>
    <m-text variant="caption" tone="muted" align="center"
      >Interactive preview. No account is created.</m-text
    >
  </m-column>
</template>
