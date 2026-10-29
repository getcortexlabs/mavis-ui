<script setup lang="ts">
withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
</script>

<template>
  <m-column gap="md">
    <m-text variant="display">{{ lang === 'pt' ? 'Olá.' : 'Hello.' }}</m-text>
    <m-text variant="title">Title</m-text>
    <m-text variant="heading">Heading</m-text>
    <m-text
      >Body · {{ lang === 'pt' ? 'Espaço para suas palavras.' : 'Room for your words.' }}</m-text
    >
    <m-text variant="caption" tone="muted"
      >Caption · {{ lang === 'pt' ? 'Os pequenos detalhes.' : 'The small details.' }}</m-text
    >
    <m-text variant="overline" tone="primary">OVERLINE</m-text>
    <m-row gap="md" wrap>
      <m-text tone="success">Success</m-text>
      <m-text tone="danger">Danger</m-text>
      <m-text tone="muted">Muted</m-text>
    </m-row>
  </m-column>
</template>
