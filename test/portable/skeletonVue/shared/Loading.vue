<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MRow, MSkeleton, MText } from '#mavis'

const moving = ref(true)
</script>

<template>
  <MColumn id="page" gap="md" :width="320">
    <MRow id="person" gap="md">
      <MSkeleton id="avatar" :width="48" :height="48" radius="full" />
      <MColumn id="lines" gap="sm" :grow="1">
        <MSkeleton id="name" />
        <m-skeleton id="role" width="60%" :height="12" />
      </MColumn>
    </MRow>
    <MSkeleton id="cover" :height="120" radius="md" effect="shimmer" :animated="moving" />
    <MColumn id="centered" gap="sm" align="center">
      <MSkeleton id="wide" :animated="false" />
      <MSkeleton id="short" :width="80" :radius="4" :animated="false" />
    </MColumn>
    <MRow id="bar" gap="sm" :height="40">
      <MSkeleton id="grown" :grow="1" height="100%" :animated="moving" />
      <MSkeleton id="fixed" :width="40" :height="20" />
    </MRow>
    <MText>{{ moving ? 'Loading' : 'Paused' }}</MText>
    <MButton text="Pause" @click="moving = !moving" />
  </MColumn>
</template>
