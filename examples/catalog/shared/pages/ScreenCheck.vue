<script setup lang="ts">
import { inject, ref } from 'vue'
import { checkInputKey, type CheckInputHandle } from '../checks/input'
import { useCatalog } from '../context'

const Input = inject(checkInputKey)!
const input = ref<CheckInputHandle>()
const name = ref('')
const focused = ref(false)
const saved = ref(false)
const { navigation } = useCatalog()
function save() {
  input.value?.blur()
  saved.value = true
}
</script>

<template>
  <m-screen id="screen-check" scroll>
    <m-column id="screen-content" padding="lg" gap="lg">
      <m-text id="screen-heading" as="h1" variant="title">Uma tela, do início ao fim.</m-text>
      <m-button id="focus-input" @click="input?.focus()">Editar nome</m-button>
      <m-card v-for="index in 8" :key="index" gap="sm">
        <m-text variant="heading">Seção {{ index }}</m-text>
        <m-text>Conteúdo para conferir rolagem, limites da tela e retorno da navegação.</m-text>
      </m-card>
      <component
        :is="Input"
        id="session-name"
        ref="input"
        v-model="name"
        @focus="focused = true"
        @blur="focused = false"
      />
      <m-text id="input-state">{{ focused ? 'Editando' : 'Teclado fechado' }}</m-text>
      <m-button id="save-name" @click="save">Salvar nome</m-button>
      <m-text v-if="saved" id="saved-name">Nome salvo: {{ name }}</m-text>
      <m-button id="next-screen" variant="secondary" @click="navigation.push('/checks/screen/next')"
        >Próxima tela</m-button
      >
      <m-text id="screen-end" variant="caption">Fim do conteúdo</m-text>
    </m-column>
  </m-screen>
</template>
