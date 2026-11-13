<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '#mavis'
import { studioLight, studioDark } from './studio-theme'
import type { Pane } from './types'
const toast = useToast()
const night = ref(false)
const selected = ref('one')
const panes = ref<Pane[]>([
  { id: 'one', title: 'First scene' },
  { id: 'two', title: 'Second scene' },
])
</script>
<template>
  <MThemeProvider
    :theme="studioLight"
    :darkTheme="studioDark"
    :appearance="night ? 'dark' : 'light'"
  >
    <MColumn gap="md">
      <MCarousel label="Studio scenes" :items="panes" v-model="selected" loop>
        <template #default="{ item }"
          ><MCard
            ><MText>{{ item.title }}</MText></MCard
          ></template
        >
      </MCarousel>
      <MText>{{ `Selected ${selected}` }}</MText>
      <MButton :text="night ? 'Use daylight' : 'Use night'" @click="night = !night" />
      <MButton text="Show notice" @click="toast.show({ message: 'Theme notice', duration: 0 })" />
      <MToast :controller="toast" />
    </MColumn>
  </MThemeProvider>
</template>
