<script setup lang="ts">
import * as mavisProbe from './shared/probe'

const probe = mavisProbe.useScrollProbe()
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText>{{ probe.report.value }}</MText>
      <MButton text="Run navigation checks" @click="() => probe.run()" />
    </MColumn>
  </MScreen>
</template>
