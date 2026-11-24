<script setup lang="ts">
import * as mavisProbe from './shared/probe'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

const probe = mavisProbe.useMotionAnchorProbe()
const surface = createMotionSurface()
</script>

<template>
  <MColumn gap="md">
    <MBox :motionSurface="surface">
      <MText>Attachment lifecycle</MText>
    </MBox>
    <MText>{{ probe.report.value }}</MText>
    <MButton text="Check attachments" @click="() => probe.run()" />
  </MColumn>
</template>
