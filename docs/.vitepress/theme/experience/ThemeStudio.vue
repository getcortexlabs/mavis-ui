<script setup>
import { computed, ref, watch } from 'vue'
import { defineTheme, mavis, midnight } from '@getcortexlabs/mavis-core'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'
import { useCopy } from './copy.js'

const props = defineProps({ pt: Boolean })
const root = ref(null)
const selected = ref('terracotta')
const dark = ref(false)
const radius = ref(18)
const name = ref('Alex')
const reminders = ref(true)
const day = ref(18)
const booked = ref(false)
const palettes = [
  {
    id: 'terracotta',
    name: 'Terracotta',
    color: '#A63D2E',
    light: '#FBEDE5',
    dark: '#F3AC92',
    deep: '#40271F',
  },
  {
    id: 'iris',
    name: 'Iris',
    color: '#5B46AE',
    light: '#F0EBFF',
    dark: '#C7B8FF',
    deep: '#302648',
  },
  {
    id: 'fern',
    name: 'Fern',
    color: '#23694E',
    light: '#E9F3EA',
    dark: '#A6D6B6',
    deep: '#1D392D',
  },
]
const palette = computed(() => palettes.find((item) => item.id === selected.value))
const themeOptions = computed(() => ({
  name: `studio-${selected.value}`,
  colors: {
    primary: dark.value ? palette.value.dark : palette.value.color,
    onPrimary: dark.value ? '#211D18' : '#FFFFFF',
    primarySoft: dark.value ? palette.value.deep : palette.value.light,
  },
  radius: { sm: Math.round(radius.value / 2), md: radius.value, lg: radius.value + 8 },
}))
const theme = computed(() => defineTheme(themeOptions.value, dark.value ? midnight : mavis))
const code = computed(
  () =>
    `import { defineTheme, ${dark.value ? 'midnight' : 'mavis'} } from '@getcortexlabs/mavis-core'\n\nexport const studio = defineTheme(${JSON.stringify(themeOptions.value, null, 2)}, ${dark.value ? 'midnight' : 'mavis'})`,
)
const { copy, copied, failed } = useCopy()
const motion = useWebMotion(root)
let scope
motion.use((value) => {
  scope = value
  return () => {
    scope = undefined
  }
})
watch(selected, () => {
  const card = root.value?.querySelector('.theme-preview-motion')
  if (scope && card) scope.animate(card, { y: [7, 0] }, { duration: 500, bounce: 0.12 })
})
watch([name, day], () => {
  booked.value = false
})
</script>

<template>
  <section
    id="studio"
    ref="root"
    class="theme-studio experience-section"
    aria-labelledby="studio-title"
  >
    <div class="studio-intro">
      <span class="experience-eyebrow"
        >02 / {{ pt ? 'SEU JEITO DE FAZER' : 'YOUR KIND OF DIFFERENT' }}</span
      >
      <h2 id="studio-title">
        {{ pt ? 'A base é nossa.' : 'Our foundation.' }}<br /><em>{{
          pt ? 'A personalidade é sua.' : 'Your fingerprint.'
        }}</em>
      </h2>
      <p>
        {{
          pt
            ? 'Mude as cores, as curvas, o clima. Os mesmos componentes, com outra história para contar.'
            : 'Change the colors, the curves, the atmosphere. The same components, with a different story to tell.'
        }}
      </p>
    </div>
    <div class="studio-workspace">
      <div class="studio-controls">
        <div>
          <span class="studio-control-label">01 — {{ pt ? 'Paleta' : 'Palette' }}</span>
          <div
            class="palette-options"
            role="group"
            :aria-label="pt ? 'Paleta de cores' : 'Color palette'"
          >
            <button
              v-for="item in palettes"
              :key="item.id"
              type="button"
              :aria-pressed="selected === item.id"
              @click="selected = item.id"
            >
              <i :style="{ backgroundColor: item.color }"></i>{{ item.name
              }}<span v-if="selected === item.id" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>
        <div>
          <label class="studio-control-label" for="studio-radius"
            >02 — {{ pt ? 'Curvas' : 'Corners' }} <output>{{ radius }}px</output></label
          ><input
            id="studio-radius"
            v-model.number="radius"
            type="range"
            min="0"
            max="28"
            step="2"
          />
          <div class="range-labels">
            <span>{{ pt ? 'Preciso' : 'Precise' }}</span
            ><span>{{ pt ? 'Suave' : 'Soft' }}</span>
          </div>
        </div>
        <div>
          <span class="studio-control-label">03 — {{ pt ? 'Atmosfera' : 'Atmosphere' }}</span>
          <div
            class="studio-mode"
            role="group"
            :aria-label="pt ? 'Aparência da demonstração' : 'Demo appearance'"
          >
            <button type="button" :aria-pressed="!dark" @click="dark = false">
              ☼ {{ pt ? 'Claro' : 'Light' }}</button
            ><button type="button" :aria-pressed="dark" @click="dark = true">
              ☾ {{ pt ? 'Escuro' : 'Dark' }}
            </button>
          </div>
        </div>
        <p class="studio-hint">
          {{
            pt
              ? 'Tokens compartilhados. Mesma identidade no Web, iOS e Android.'
              : 'Shared tokens. The same identity on Web, iOS and Android.'
          }}
        </p>
      </div>
      <div
        class="theme-preview-stage"
        :style="{ '--studio-accent': palette.color, '--studio-soft': palette.light }"
      >
        <span class="stage-cross cross-one" aria-hidden="true">+</span
        ><span class="stage-cross cross-two" aria-hidden="true">+</span>
        <div class="theme-preview-motion">
          <MThemeProvider :theme="theme">
            <div
              class="theme-preview-card"
              :style="{
                color: theme.colors.text,
                background: theme.colors.surface,
                borderRadius: `${radius + 8}px`,
              }"
            >
              <span
                class="booking-icon"
                :style="{ color: theme.colors.primary, background: theme.colors.primarySoft }"
                aria-hidden="true"
                >✳︎</span
              >
              <span class="booking-eyebrow" :style="{ color: theme.colors.muted }"
                >SUNDAY STUDIO</span
              >
              <h3>{{ pt ? 'Tempo para criar.' : 'Time to make.' }}</h3>
              <p :style="{ color: theme.colors.muted }">
                {{
                  pt
                    ? 'Reserve um pouco do dia para sua próxima ideia.'
                    : 'Make a little space for your next idea.'
                }}
              </p>
              <div
                class="booking-days"
                role="group"
                :aria-label="pt ? 'Dia da sessão de demonstração' : 'Demo session day'"
              >
                <button
                  v-for="(number, index) in [16, 17, 18, 19, 20]"
                  :key="number"
                  type="button"
                  :aria-pressed="day === number"
                  :style="{
                    background: day === number ? theme.colors.primary : theme.colors.background,
                    color: day === number ? theme.colors.onPrimary : theme.colors.text,
                    borderRadius: `${radius / 2}px`,
                  }"
                  @click="day = number"
                >
                  <small>{{
                    (pt
                      ? ['SEG', 'TER', 'QUA', 'QUI', 'SEX']
                      : ['MON', 'TUE', 'WED', 'THU', 'FRI'])[index]
                  }}</small
                  >{{ number }}
                </button>
              </div>
              <MInput v-model="name" :label="pt ? 'Seu nome' : 'Your name'" />
              <MSwitch
                v-model="reminders"
                :label="pt ? 'Lembrar da minha pausa' : 'Remind me to take a break'"
              />
              <MButton
                :text="
                  booked
                    ? pt
                      ? 'Está na agenda ✓'
                      : 'You’re on the list ✓'
                    : pt
                      ? 'Reservar esse momento'
                      : 'Save a little time'
                "
                :disabled="!name.trim()"
                @click="booked = true"
              />
              <p class="booking-feedback" role="status" :style="{ color: theme.colors.muted }">
                {{
                  booked
                    ? pt
                      ? `${name}, seu momento é dia ${day}.`
                      : `${name}, your moment is on the ${day}th.`
                    : pt
                      ? 'Demonstração local. Nenhuma reserva é enviada.'
                      : 'A local demo. No reservation is sent.'
                }}
              </p>
            </div>
          </MThemeProvider>
        </div>
        <span class="studio-stage-caption">{{
          pt ? 'COMPONENTES REAIS / SUA CONFIGURAÇÃO' : 'REAL COMPONENTS / YOUR CONFIGURATION'
        }}</span>
      </div>
      <div class="studio-code">
        <div>
          <span>theme.ts</span
          ><button type="button" @click="copy(code)">
            {{ copied ? (pt ? 'Copiado ✓' : 'Copied ✓') : pt ? 'Copiar tema ↗' : 'Copy theme ↗' }}
          </button>
        </div>
        <pre
          tabindex="0"
          :aria-label="pt ? 'Código do tema' : 'Theme code'"
        ><code>{{ code }}</code></pre>
        <p v-if="failed" role="status">
          {{ pt ? 'Selecione o código acima para copiar.' : 'Select the code above to copy it.' }}
        </p>
      </div>
    </div>
  </section>
</template>
