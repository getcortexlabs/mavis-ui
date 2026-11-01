<script setup lang="ts">
import { ref } from 'vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'
const { navigation } = useCatalog()
const selected = ref(false),
  disabled = ref(false),
  accept = ref(false)
const requests = ref(0),
  removals = ref(0)
function request(value: boolean) {
  requests.value++
  if (accept.value) selected.value = value
}
</script>
<template>
  <m-screen scroll
    ><m-column padding="lg" gap="lg">
      <m-row justify="between"
        ><m-button variant="ghost" @click="navigation.back('/')">Catálogo</m-button><ThemeSwitch
      /></m-row>
      <m-text as="h1" variant="title">Chip check</m-text>
      <m-chip
        id="combined-chip"
        label="Design"
        icon="palette"
        selectable
        removable
        removeLabel="Remover Design"
        :modelValue="selected"
        :disabled="disabled"
        @update:modelValue="request"
        @remove="removals++"
      />
      <m-text>{{ requests }} solicitações; {{ removals }} remoções</m-text>
      <m-switch v-model="accept" label="Aceitar mudanças" />
      <m-switch v-model="disabled" label="Desabilitar chip" />
      <m-row gap="sm" wrap>
        <m-chip
          label="Uma descoberta que merece espaço mesmo com um título muito longo"
          selectable
        />
        <m-chip label="الإلهام والتصميم" removable removeLabel="Remover inspiração" />
      </m-row>
      <m-empty-state
        title="Há espaço para uma nova história e todas as ideias que ainda estão por vir."
        description="Um texto longo deve continuar legível, com ações que encontram seu lugar em telas pequenas."
        compact
      >
        <template #actions
          ><m-button>Começar uma nova coleção</m-button
          ><m-button variant="ghost">Conhecer outras ideias</m-button></template
        >
      </m-empty-state>
    </m-column></m-screen
  >
</template>
