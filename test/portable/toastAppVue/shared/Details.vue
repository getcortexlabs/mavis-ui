<script setup lang="ts">
import { useToast } from '@getcortexlabs/mavis-core/vue'
const toast = useToast({ scope: 'app' })
</script>
<template>
  <MScreen
    ><MText>Details</MText><MButton text="Dismiss current" @click="toast.dismiss()" /><MButton
      text="Clear notifications"
      @click="toast.clear()" /><MButton text="Home" href="/"
  /></MScreen>
</template>
