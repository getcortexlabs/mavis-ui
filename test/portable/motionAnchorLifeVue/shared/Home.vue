<script setup lang="ts">
import { markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMotionAnchorProbe } from './probe'
const surface = markRaw(createMotionSurface())
const probe = useMotionAnchorProbe()
</script>
<template>
  <MColumn gap="md"
    ><MBox :motionSurface="surface"><MText>Attachment lifecycle</MText></MBox
    ><MText>{{ probe.report.value }}</MText
    ><MButton text="Check attachments" @click="probe.run()"
  /></MColumn>
</template>
