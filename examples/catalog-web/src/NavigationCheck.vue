<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
const disabled = ref(false)
const failures = ref(0)
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-button @click="disabled = !disabled">Toggle disabled links</m-button>
      <RouterLink to="/checks/composition" custom v-slot="{ href, navigate }">
        <m-button :href="href" :navigate="() => navigate()" :disabled="disabled"
          >Router button</m-button
        >
      </RouterLink>
      <RouterLink to="/checks/composition" custom v-slot="{ href, navigate }">
        <m-card
          :href="href"
          :navigate="() => navigate()"
          :disabled="disabled"
          accessibilityLabel="Router card"
        >
          <m-text variant="heading">Router card</m-text>
          <m-text>One anchor for this destination.</m-text>
        </m-card>
      </RouterLink>
      <m-link
        href="/unavailable"
        :navigate="() => Promise.reject(new Error('Unavailable'))"
        @error="failures++"
        >Rejected navigation</m-link
      >
      <m-text id="navigation-failures">{{ failures }} reported failures</m-text>
    </m-column>
  </m-screen>
</template>
