<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import {
  createMotionRegion,
  createMotionSurface,
  whenMotionAvailable,
  type MotionPhysicsWorld,
  type MotionKeyboardState,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import { useCatalogLocale } from '../locale'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog(),
  { locale } = useCatalogLocale(),
  { theme } = useMavisTheme()
const pt = computed(() => locale.value === 'pt')
const arena = markRaw(createMotionRegion()),
  composer = markRaw(createMotionSurface())
const balls = [0, 1, 2].map(() => markRaw(createMotionSurface()))
const mounted = ref(true),
  ready = ref(false),
  held = ref(false),
  error = ref(''),
  draft = ref('')
const sheet = ref(false),
  dialog = ref(false),
  closeReason = ref(''),
  impulses = ref(0)
const keyboard = ref<MotionKeyboardState>({
  visible: false,
  height: 0,
  duration: 0,
  backend: 'none',
  accuracy: 'unavailable',
})
let world: MotionPhysicsWorld | undefined
const stops = [
  whenMotionAvailable([arena, ...balls], () => {
    let active = true
    void arena
      .physicsWorld(
        balls.map((target, index) => ({
          id: String(index),
          target,
          radius: 20,
          x: 50 + index * 90,
          y: 55,
          drag: { type: 'spring', line: { color: '#4262C4', width: 1.5 } },
        })),
        {
          gravity: { x: 0, y: 480 },
          restitution: 0.65,
          springs: [
            {
              id: 'pair',
              from: '0',
              to: '1',
              length: 90,
              stiffness: 90,
              damping: 12,
              line: { color: '#B83670' },
            },
          ],
        },
      )
      .then((control) => {
        if (!active) {
          control.dispose()
          return
        }
        world = control
        ready.value = true
        held.value = false
      })
      .catch((reason) => {
        if (active) error.value = String(reason)
      })
    return () => {
      active = false
      world?.dispose()
      world = undefined
      ready.value = false
    }
  }),
  arena.onAvailable(() => {
    arena.onKeyboard((value) => {
      keyboard.value = value
    })
  }),
  composer.use((motion) => {
    motion.followKeyboard({ offset: 12 })
  }),
]
function pause() {
  if (!world) return
  if (held.value) world.resume()
  else world.pause()
  held.value = world.paused
}
function impulse() {
  if (!world) return
  world.impulse('2', { x: -100, y: -500 })
  impulses.value++
}
onBeforeUnmount(() => stops.forEach((stop) => stop()))
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        ><ThemeSwitch
      /></m-row>
      <m-text variant="overline" tone="accent">19 / ORBIT</m-text>
      <m-text variant="display">{{
        pt ? 'Encontre seu equilíbrio.' : 'Find your balance.'
      }}</m-text>
      <m-text tone="muted">{{
        pt
          ? 'Puxe uma esfera, solte e acompanhe o movimento.'
          : 'Pull a sphere, release it and follow the motion.'
      }}</m-text>
      <m-button id="orbit-mount" variant="secondary" @click="mounted = !mounted">{{
        mounted
          ? pt
            ? 'Retirar o palco'
            : 'Remove the stage'
          : pt
            ? 'Montar o palco'
            : 'Mount the stage'
      }}</m-button>
      <m-box
        v-if="mounted"
        id="orbit-arena"
        :motionRegion="arena"
        :width="280"
        :height="260"
        :backgroundColor="theme.colors.elevated"
        radius="lg"
      >
        <m-box
          v-for="(ball, index) in balls"
          :key="index"
          :id="`orbit-ball-${index}`"
          :motionSurface="ball"
          :width="40"
          :height="40"
          radius="full"
          :backgroundColor="[theme.colors.primary, theme.colors.accent, '#DAAA57'][index]"
          :style="{
            horizontalAlignment: 'left',
            verticalAlignment: 'top',
            alignSelf: 'flex-start',
            justifySelf: 'start',
          }"
          :accessibilityLabel="`${pt ? 'Esfera' : 'Sphere'} ${index + 1}`"
        />
      </m-box>
      <m-text id="orbit-ready" variant="caption"
        >{{
          ready ? (pt ? 'Pronto para mover' : 'Ready to move') : pt ? 'Preparando' : 'Preparing'
        }}
        · {{ impulses }}</m-text
      >
      <m-text v-if="error" id="orbit-error" tone="danger">{{ error }}</m-text>
      <m-row wrap gap="sm">
        <m-button id="orbit-impulse" :disabled="!ready" @click="impulse">{{
          pt ? 'Impulso' : 'Impulse'
        }}</m-button>
        <m-button id="orbit-pause" :disabled="!ready" variant="secondary" @click="pause">{{
          held ? (pt ? 'Continuar' : 'Resume') : pt ? 'Pausar' : 'Pause'
        }}</m-button>
        <m-button id="orbit-reset" :disabled="!ready" variant="secondary" @click="world?.reset()">{{
          pt ? 'Recomeçar' : 'Reset'
        }}</m-button>
      </m-row>
      <m-card gap="md"
        ><m-text variant="heading">{{
          pt ? 'Um espaço para suas ideias.' : 'Room for your ideas.'
        }}</m-text
        ><m-text tone="muted">{{
          pt ? 'Os controles acompanham a conversa.' : 'Controls that follow the conversation.'
        }}</m-text
        ><m-row wrap gap="sm"
          ><m-button id="orbit-sheet" @click="sheet = true">{{
            pt ? 'Abrir opções' : 'Open options'
          }}</m-button
          ><m-button id="orbit-dialog" variant="secondary" @click="dialog = true">{{
            pt ? 'Revisar escolha' : 'Review choice'
          }}</m-button></m-row
        ></m-card
      >
      <m-box :motionSurface="composer"
        ><m-column gap="sm"
          ><m-input
            id="orbit-draft"
            v-model="draft"
            :label="pt ? 'Sua ideia' : 'Your idea'"
          /><m-text id="orbit-keyboard" variant="caption">{{
            keyboard.visible
              ? pt
                ? 'Teclado aberto'
                : 'Keyboard open'
              : pt
                ? 'Continue quando quiser.'
                : 'Continue whenever you like.'
          }}</m-text></m-column
        ></m-box
      >
      <m-text id="orbit-close" variant="caption">{{ closeReason }}</m-text>
      <m-sheet
        v-model:open="sheet"
        :title="pt ? 'Pequenas escolhas' : 'Small choices'"
        :closeLabel="pt ? 'Fechar' : 'Close'"
        gap="md"
        ><m-input v-model="draft" :label="pt ? 'Sua ideia' : 'Your idea'" /><m-text
          v-for="n in 18"
          :key="n"
          >{{ pt ? 'Uma possibilidade' : 'A possibility' }} {{ n }}</m-text
        ></m-sheet
      >
      <m-dialog
        v-model:open="dialog"
        interactive
        :title="pt ? 'Guardar esta ideia?' : 'Keep this idea?'"
        :description="
          draft || (pt ? 'Você pode mudar de ideia depois.' : 'You can change your mind later.')
        "
        :confirmLabel="pt ? 'Guardar' : 'Keep'"
        :cancelLabel="pt ? 'Cancelar' : 'Cancel'"
        :loadingLabel="pt ? 'Guardando' : 'Saving'"
        @confirm="dialog = false"
        @close="(reason) => (closeReason = reason)"
      />
    </m-column>
  </m-screen>
</template>
