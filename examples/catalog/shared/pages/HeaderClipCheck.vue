<script setup lang="ts">
import { ref } from 'vue'
const parallax = ref(true)
</script>
<template>
  <MColumn gap="md">
    <MCollapsibleHeader
      id="clip-header"
      title="Clipping specimen"
      subtitle="Visible above opaque artwork"
      :height="360"
      :expandedHeight="200"
      :collapsedHeight="56"
      :sectionHeight="40"
      :parallax="parallax ? 0.5 : 0"
    >
      <template #artwork><MColumn id="clip-art" backgroundColor="#FF0000" /></template>
      <template #section><MColumn id="clip-section" backgroundColor="#00FF00" /></template>
      <MColumn id="clip-content" :height="1200" backgroundColor="#0000FF" />
    </MCollapsibleHeader>
    <MButton
      id="clip-parallax"
      :text="parallax ? 'Disable parallax' : 'Enable parallax'"
      @click="parallax = !parallax"
    />
  </MColumn>
</template>
