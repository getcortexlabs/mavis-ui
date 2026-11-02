<script setup lang="ts">
import { computed, ref, markRaw, onBeforeUnmount } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { createFormaMotion } from '../forma-motion'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import { useCatalogLocale } from '../locale'
import { formaImage } from '../assets/forma-image'
import ThemeSwitch from '../ThemeSwitch.vue'
const { navigation } = useCatalog()
const { locale } = useCatalogLocale()
const pt = computed(() => locale.value === 'pt')
const { theme } = useMavisTheme()
const paintTheme = computed(() => ({
  ...theme.value,
  motion: { ...theme.value.motion, pressScale: 0.96 },
}))
const paintStyle = { borderWidth: 2 }
const paintSurface = markRaw(createMotionSurface())
const intensity = ref(0)
let paint: ReturnType<typeof createFormaMotion> | undefined
const removePaint = paintSurface.onAvailable(() => {
  paint = createFormaMotion(paintSurface)
  paint.set(intensity.value)
  return () => {
    paint = undefined
  }
})
onBeforeUnmount(removePaint)
function changePaint(value: number) {
  intensity.value = value
  paint?.set(value)
}
const quantity = ref<number | null>(1)
const extras = ref<ChoiceValue[]>(['frame'])
const delivery = ref<ChoiceValue>('standard')
const sustainable = ref(true),
  gift = ref(false),
  added = ref(false)
const panels = ref<ChoiceValue[]>([])
const extraText = ref(false)
const note = ref('')
const options = computed(() => [
  { value: 'frame', label: pt.value ? 'Moldura de madeira · + R$ 40' : 'Wood frame · + $40' },
  {
    value: 'note',
    label: pt.value ? 'Cartão escrito à mão · + R$ 10' : 'Handwritten note · + $10',
  },
  {
    value: 'signed',
    label: pt.value ? 'Edição assinada · esgotada' : 'Signed edition · sold out',
    disabled: true,
  },
])
const total = computed(
  () =>
    (quantity.value ?? 0) *
    (120 + (extras.value.includes('frame') ? 40 : 0) + (extras.value.includes('note') ? 10 : 0)),
)
const items = computed(() => [
  { value: 'details', title: pt.value ? 'Feito para durar' : 'Made to last' },
])
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        ><ThemeSwitch
      /></m-row>
      <m-row justify="between"
        ><m-text variant="overline" tone="primary">FORMA / EDITION 01</m-text
        ><m-badge :text="pt ? 'Pequenas tiragens' : 'Small editions'" tone="accent"
      /></m-row>
      <m-stack gap="lg" :responsive="{ at: 780, direction: 'row', gap: 'xl' }">
        <m-column :grow="1" gap="md">
          <m-image
            id="forma-image"
            :src="formaImage"
            :alt="pt ? 'Gravura Forma, edição 01' : 'Forma art print, edition 01'"
            :aspectRatio="4 / 3"
            radius="lg"
          />
          <m-text variant="caption" tone="muted">{{
            pt
              ? 'Papel com textura. Cor com intenção. Um lugar só seu.'
              : 'Textured paper. Considered colour. A space of your own.'
          }}</m-text>
        </m-column>
        <m-card :grow="1" gap="lg">
          <m-column gap="xs"
            ><m-text as="h1" variant="display">{{
              pt ? 'Dê forma ao seu espaço.' : 'Give your space a little shape.'
            }}</m-text
            ><m-text tone="muted">{{
              pt ? 'Uma edição de arte. Do seu jeito.' : 'An art edition. Made yours.'
            }}</m-text></m-column
          >
          <m-number-input
            id="forma-quantity"
            v-model="quantity"
            :label="pt ? 'Quantidade' : 'Quantity'"
            :min="1"
            :max="8"
            :locale="pt ? 'pt-BR' : 'en-US'"
            :incrementLabel="pt ? 'Aumentar' : 'Increase'"
            :decrementLabel="pt ? 'Diminuir' : 'Decrease'"
          />
          <m-multi-select
            id="forma-extras"
            v-model="extras"
            :options="options"
            :maxSelected="2"
            label="Extras"
            :searchLabel="pt ? 'Buscar extras' : 'Search extras'"
            :closeLabel="pt ? 'Concluir' : 'Done'"
            :removeLabel="pt ? 'Remover' : 'Remove'"
            :placeholder="pt ? 'Escolher extras' : 'Choose extras'"
            :emptyLabel="pt ? 'Nenhuma opção encontrada' : 'No matching options'"
          />
          <m-switch
            v-model="sustainable"
            :label="pt ? 'Embalagem reciclável' : 'Recyclable packaging'"
          />
          <m-checkbox v-model="gift" :label="pt ? 'É um presente' : 'This is a gift'" />
          <m-radio-group
            v-model="delivery"
            :label="pt ? 'Entrega' : 'Delivery'"
            :options="[
              { value: 'standard', label: pt ? 'Padrão · incluída' : 'Standard · included' },
              { value: 'pickup', label: pt ? 'Retirar no ateliê' : 'Collect at the studio' },
            ]"
          />
          <m-separator />
          <m-row justify="between"
            ><m-text tone="muted">Total</m-text
            ><m-text id="forma-total" variant="title"
              >{{ pt ? 'R$' : '$' }} {{ total }}</m-text
            ></m-row
          >
          <m-button :disabled="quantity === null" @click="added = true">{{
            added
              ? pt
                ? 'Edição reservada'
                : 'Edition reserved'
              : pt
                ? 'Reservar minha edição'
                : 'Reserve my edition'
          }}</m-button>
          <m-text variant="caption" tone="muted">{{
            pt
              ? 'Demonstração local. Nenhuma compra é realizada.'
              : 'Local demonstration. No purchase is made.'
          }}</m-text>
        </m-card>
      </m-stack>
      <m-column gap="lg" padding="lg" align="center">
        <m-text variant="overline">{{ pt ? 'ESTUDO DE COR' : 'COLOUR STUDY' }}</m-text>
        <m-theme-provider :theme="paintTheme">
          <m-card
            id="forma-paint"
            :motionSurface="paintSurface"
            interactive
            :width="220"
            :height="100"
            :style="paintStyle"
            :accessibilityLabel="pt ? 'Estudo de cor' : 'Colour study'"
            @click="changePaint(intensity === 1 ? 0 : 1)"
          >
            <m-text :style="{ color: '#251D32', fontWeight: '600' }">{{
              pt ? 'Toque para transformar' : 'Press to transform'
            }}</m-text>
          </m-card>
        </m-theme-provider>
        <m-text id="forma-intensity" variant="caption">{{ Math.round(intensity * 100) }}%</m-text>
        <m-slider
          :modelValue="intensity"
          :min="0"
          :max="1"
          :step="0.01"
          :label="pt ? 'Intensidade' : 'Intensity'"
          @update:modelValue="changePaint"
        />
        <m-button id="forma-cool" size="sm" variant="ghost" @click="changePaint(1)">{{
          pt ? 'Tom frio' : 'Cool tone'
        }}</m-button>
      </m-column>
      <m-accordion
        id="forma-accordion"
        v-model="panels"
        :items="items"
        :label="pt ? 'Sobre a edição' : 'About this edition'"
      >
        <m-column gap="md">
          <m-text>{{
            pt
              ? 'Impressão de arte em papel encorpado, pensada para acompanhar sua casa por muitos anos.'
              : 'An art print on substantial paper, made to stay with your home for years.'
          }}</m-text>
          <m-button id="forma-more" variant="ghost" @click="extraText = !extraText">{{
            pt ? 'Mais detalhes' : 'More details'
          }}</m-button>
          <m-text v-if="extraText">{{
            pt
              ? 'Cada edição é conferida à mão. A moldura usa madeira de origem responsável e o pacote protege a obra sem excesso de material.'
              : 'Every edition is checked by hand. The frame uses responsibly sourced wood, and the packaging protects the work without excess material.'
          }}</m-text>
          <m-input id="forma-note" v-model="note" :label="pt ? 'Uma observação' : 'A note'" />
        </m-column>
      </m-accordion>
    </m-column>
  </m-screen>
</template>
