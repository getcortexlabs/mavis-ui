<script setup lang="ts">
import * as mavisProbe from './shared/probe'

const store = mavisProbe.useFileProbe()
</script>

<template>
  <MColumn gap="md">
    <MText>{{ store.report.value }}</MText>
    <MButton text="Run file checks" @click="() => store.run()" />
  </MColumn>
</template>
