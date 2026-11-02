<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, markRaw } from 'vue'
import {
  MScreen,
  MColumn,
  MRow,
  MCard,
  MText,
  MInput,
  MButton,
  MCheckbox,
  MRadioGroup,
  MSelect,
  MSlider,
  MTabs,
  MAccordion,
  MSheet,
  MDialog,
  MReveal,
  MThemeProvider,
  MAvatar,
  MBadge,
  MAlert,
  useMavisTheme,
  useToast,
  midnight,
} from '@getcortexlabs/mavis-web'
import {
  createMotionSurface,
  createMotionScrollSource,
} from '@getcortexlabs/mavis-core/experimental'

const props = defineProps<{
  profile: { name: string; email: string }
  initialSheet?: boolean
}>()
const name = ref(props.profile.name)
const email = ref(props.profile.email)
const notes = ref('Keep mornings for creative work.')
const newsletter = ref(false)
const ambience = ref<string | number | null>('rain')
const language = ref<string | number | null>(null)
const duration = ref(30)
const tab = ref<string | number | null>('details')
const expanded = ref<(string | number)[]>([])
const sheet = ref(props.initialSheet ?? false)
const dialog = ref(false)
const reveal = ref(false)
const saves = ref(0)
const hydrated = ref(false)
const surface = markRaw(createMotionSurface())
const scroll = markRaw(createMotionScrollSource())
const cardSurface = markRaw(createMotionSurface())
const probe = {
  mounts: 0,
  releases: 0,
  surface,
  scroll,
  value: undefined as ReturnType<typeof surface.motionValue> | undefined,
  link: undefined as ReturnType<typeof surface.scrollLinked> | undefined,
}
const releaseSurface = surface.onAvailable(() => {
  probe.mounts++
  probe.value = surface.motionValue(0)
  return () => {
    probe.releases++
  }
})
const releaseScroll = scroll.onAvailable(() =>
  cardSurface.onAvailable(() => {
    probe.link = cardSurface.scrollLinked(scroll, { opacity: [1, 0.85] }, { range: [0, 300] })
  }),
)
onBeforeUnmount(() => {
  releaseScroll()
  releaseSurface()
})
const toast = useToast({ scope: 'app' })
const { theme, setAppearance } = useMavisTheme()
onMounted(() => {
  hydrated.value = true
  Object.assign(window, { __mavisProbe: probe })
})
function save() {
  saves.value++
}
</script>

<template>
  <MScreen scroll :motionScroll="scroll">
    <MColumn class="notebook" padding="xl" gap="xl" :data-appearance="theme.appearance">
      <MRow justify="between" gap="lg">
        <MText variant="overline" tone="primary">THE WEEKDAY NOTEBOOK</MText>
        <MBadge text="Your space" />
      </MRow>
      <MColumn gap="sm">
        <MText as="h1" variant="display" class="notebook-heading"
          >Make time for what matters.</MText
        >
        <MText tone="muted">A few thoughtful choices for your next chapter.</MText>
      </MColumn>
      <nav class="notebook-nav" aria-label="Notebook">
        <NuxtLink to="/saved">Your sessions</NuxtLink>
        <NuxtLink to="/static">Studio edition</NuxtLink>
      </nav>
      <MCard gap="lg">
        <MRow gap="md">
          <MAvatar :name="profile.name" />
          <MColumn gap="xs">
            <MText variant="heading">{{ profile.name }}’s notebook</MText>
            <MText variant="caption" tone="muted">Made for your rhythm.</MText>
          </MColumn>
        </MRow>
        <form :data-hydrated="hydrated" @submit.prevent="save">
          <MColumn gap="lg">
            <MInput
              v-model="name"
              label="Name"
              name="name"
              autocomplete="name"
              helperText="How we address you."
            />
            <MInput
              v-model="email"
              label="Email"
              name="email"
              type="email"
              autocomplete="email"
              required
            />
            <MInput v-model="notes" label="Notes" name="notes" multiline />
            <MCheckbox
              v-model="newsletter"
              label="Send me the weekly note"
              helperText="One thoughtful read, every Sunday."
            />
            <MRadioGroup
              v-model="ambience"
              label="Background sound"
              :options="[
                { value: 'rain', label: 'Rain' },
                { value: 'quiet', label: 'Quiet' },
              ]"
            />
            <MSlider v-model="duration" label="Session length" :min="15" :max="60" :step="5" />
            <MSelect
              v-model="language"
              label="Reading language"
              :options="[
                { value: 'en', label: 'English' },
                { value: 'pt', label: 'Português' },
              ]"
            />
            <MRow gap="md" wrap>
              <MButton type="submit">Save preferences</MButton>
              <MButton variant="secondary" @click="sheet = true">Preview</MButton>
              <MButton variant="ghost" @click="name = 'Updated by parent'">Reset name</MButton>
            </MRow>
            <MText role="status" :data-save-count="saves">{{
              saves ? 'Preferences saved.' : 'Make this space your own.'
            }}</MText>
            <output hidden data-testid="model"
              >{{ name }} / {{ notes }} / {{ newsletter }} / {{ ambience }} / {{ duration }}</output
            >
          </MColumn>
        </form>
      </MCard>
      <MTabs
        v-model="tab"
        label="Notebook sections"
        :tabs="[
          { value: 'details', label: 'Details' },
          { value: 'rituals', label: 'Rituals' },
        ]"
      >
        <template #default="{ value }"
          ><MText>{{
            value === 'details' ? 'Small changes add up.' : 'Start with five quiet minutes.'
          }}</MText></template
        >
      </MTabs>
      <MAccordion
        v-model="expanded"
        label="Questions"
        :items="[{ value: 'privacy', title: 'Who can see my notebook?' }]"
      >
        <template #default><MText>Your notebook belongs to you.</MText></template>
      </MAccordion>
      <MRow gap="md" wrap>
        <MButton
          :motionSurface="surface"
          @click="surface.animate({ y: [0, -6, 0] }, { duration: 200 })"
          >Take a breath</MButton
        >
        <MButton variant="ghost" @click="reveal = !reveal">A small reminder</MButton>
        <MButton
          variant="ghost"
          @click="setAppearance(theme.appearance === 'dark' ? 'light' : 'dark')"
          >Change appearance</MButton
        >
      </MRow>
      <MReveal :show="reveal"><MText>You do not have to do everything today.</MText></MReveal>
      <MThemeProvider :theme="midnight" appearance="dark">
        <MCard data-testid="theme-scope" gap="sm" :motionSurface="cardSurface"
          ><MText variant="overline">AFTER HOURS</MText
          ><MText variant="title">Leave room for a little wonder.</MText></MCard
        >
      </MThemeProvider>
      <MButton variant="ghost" @click="dialog = true">Discard changes</MButton>
      <MButton
        variant="ghost"
        @click="toast.show({ title: 'All set', message: 'Your notebook is ready.', duration: 0 })"
        >Notify me</MButton
      >
      <MSheet v-model:open="sheet" title="Your next chapter">
        <MInput v-model="notes" label="Preview notes" />
        <MAlert title="All yours" description="You can change these preferences at any time." />
        <MButton @click="sheet = false">Back to notebook</MButton>
      </MSheet>
      <MDialog
        v-model:open="dialog"
        title="Discard these changes?"
        confirmLabel="Discard"
        @confirm="dialog = false"
      />
    </MColumn>
  </MScreen>
</template>
