<script setup lang="ts">
import { ref } from 'vue'
import { useWork } from './work'
import Working from './Working.vue'
import PendingProps from './PendingProps.vue'
const work = useWork()
const shown = ref(true)
const completed = ref(0)
const disposed = ref(0)
const currentId = ref('first')
</script>
<template>
  <MColumn gap="md">
    <MText>{{ work.status.value }}</MText>
    <MText>Cancelled {{ work.cancelled.value }}, committed {{ work.committed.value }}</MText>
    <MText>Completed {{ completed }}, disposed {{ disposed }}</MText>
    <MButton text="Hide child" @click="shown = false" />
    <MButton text="Show child" @click="shown = true" />
    <MButton text="Finish pending work" @click="work.finish()" />
    <Working v-if="shown" @complete="completed += 1" @disposed="disposed += 1" />
    <MButton text="Change current id" @click="currentId = 'second'" />
    <PendingProps :id="currentId" />
  </MColumn>
</template>
