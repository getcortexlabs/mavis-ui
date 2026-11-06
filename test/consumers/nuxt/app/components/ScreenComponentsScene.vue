<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { RefreshContext } from '@getcortexlabs/mavis-core'
const ready = ref(false),
  pin = ref('001234'),
  draft = ref('A server-rendered draft'),
  open = ref(false),
  selected = ref(''),
  edition = ref(1)
onMounted(() => {
  ready.value = true
})
async function refresh(context: RefreshContext) {
  await context.commit(() => {
    edition.value++
  })
}
</script>
<template>
  <MColumn padding="lg" gap="lg">
    <MText id="screen-components-ready" :text="ready ? 'ready' : 'pending'" />
    <MAnimatedText text="Make room for wonder." />
    <MPinInput v-model="pin" label="Verification code" />
    <MComposer v-model="draft" label="Message" @submit="draft = ''" />
    <MSpeedDial
      v-model:open="open"
      label="Create"
      :actions="[{ value: 'note', label: 'Write a note' }]"
      @select="(value) => (selected = String(value))"
    />
    <MCollapsibleHeader title="Field notes" :height="360"
      ><MText text="A retained story"
    /></MCollapsibleHeader>
    <MRefreshControl label="Morning edition" :refresh="refresh" :height="300"
      ><MText id="screen-components-edition" :text="String(edition)"
    /></MRefreshControl>
    <MText id="screen-components-state" :text="`${pin}|${selected}`" />
  </MColumn>
</template>
