<script setup lang="ts">
import { reactive } from 'vue'
import { useToast, useMavisNavigation } from '@getcortexlabs/mavis-core/vue'

const state = reactive({
  save(): void {
    toast.show({ message: 'Saved across routes', duration: 0 })
    const removed = toast.show({ message: 'Remove this queued item', duration: 0 })
    toast.show({ message: 'Next queued item', duration: 0 })
    toast.dismiss(removed)
    mavisNavigation.push('/details')
  },
})
const toast = useToast({ scope: 'app' })
const mavisNavigation = useMavisNavigation()
</script>

<template>
  <MScreen>
    <MText>Workspace</MText>
    <MButton text="Save and open" @click="() => state.save()" />
  </MScreen>
</template>
