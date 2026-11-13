<script setup lang="ts">
import { ref } from 'vue'
import Draft from './Draft.vue'
const value = ref('Original')
function change() {
  value.value = 'Updated'
}
</script>

<template>
  <MColumn gap="md">
    <MButton text="Change source" @click="change" />
    <Draft :value="value" />
  </MColumn>
</template>
