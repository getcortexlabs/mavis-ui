<script setup lang="ts">
import { useToast, useMavisNavigation } from '@getcortexlabs/mavis-core/vue'
const toast = useToast({ scope: 'app' })
const navigation = useMavisNavigation()
function save() {
  toast.show({ message: 'Saved across routes', duration: 0 })
  const removed = toast.show({ message: 'Remove this queued item', duration: 0 })
  toast.show({ message: 'Next queued item', duration: 0 })
  toast.dismiss(removed)
  navigation.push('/details')
}
</script>
<template>
  <MScreen><MText>Workspace</MText><MButton text="Save and open" @click="save" /></MScreen>
</template>
