<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
const { navigation } = useCatalog()
const toast = useToast()
const sheet = ref(false)
const showHost = ref(true)
const edits = ref('')
const taps = ref(0)
function timed() {
  toast.show({ title: 'Timed notice', message: 'The screen stays available.', duration: 1500 })
}
function queued(duration = 1000) {
  for (const message of ['First', 'Second', 'Third']) toast.show({ message, duration })
}
</script>
<template>
  <m-screen scroll :dismissKeyboard="false">
    <m-column padding="lg" gap="md">
      <m-text as="h1" variant="heading">Toast checks</m-text>
      <m-input v-model="edits" label="Editor" @submit="timed" />
      <m-button id="timed" @click="timed">Timed notice</m-button>
      <m-button id="queue" @click="queued()">Queue three</m-button>
      <m-button
        id="persistent"
        @click="
          toast.show({ title: 'Persistent notice', message: 'Dismiss when ready.', duration: 0 })
        "
        >Persistent notice</m-button
      >
      <m-button
        id="long"
        @click="
          toast.show({
            title: 'Uma confirmação que acompanha o seu ritmo',
            message:
              'Suas alterações foram salvas. Você pode continuar editando os detalhes do perfil, escolher outro interesse e voltar quando quiser, sem perder o que já ficou pronto.',
            duration: 0,
          })
        "
        >Long notice</m-button
      >
      <m-button id="dismiss" @click="toast.dismiss()">Dismiss current</m-button>
      <m-button id="clear" @click="toast.clear()">Clear queue</m-button>
      <m-button id="sheet" @click="sheet = true">Open sheet</m-button>
      <m-button id="toggle-host" @click="showHost = !showHost">Toggle host</m-button>
      <m-button id="background" @click="taps++">Background action</m-button>
      <m-button @click="queued(4000)">Slow queue</m-button>
      <m-button @click="toast.show({ message: 'Resume this notice', duration: 5000 })"
        >Long timer</m-button
      >
      <m-button @click="navigation.push('/checks/screen/next')">Navigate away</m-button>
      <m-text>Taps: {{ taps }}</m-text>
      <m-text>Editor: {{ edits }}</m-text>
    </m-column>
    <m-toast v-if="showHost" :controller="toast" closeLabel="Dismiss notice" />
    <m-sheet v-model:open="sheet" title="Modal first" closeLabel="Close sheet">
      <m-button @click="timed">Queue while covered</m-button>
      <m-text>The toast waits behind this sheet.</m-text>
    </m-sheet>
  </m-screen>
</template>
