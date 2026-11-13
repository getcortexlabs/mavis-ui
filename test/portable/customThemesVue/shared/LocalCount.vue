<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>
<template>
  <MColumn gap="xs"
    ><MText>{{ `Local ${count}` }}</MText
    ><MButton text="Add local" @click="count++"
  /></MColumn>
</template>
