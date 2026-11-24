<script setup lang="ts">
import { reactive } from 'vue'
import type { Pane } from './types'
import { useToast } from '@getcortexlabs/mavis-core/vue'
import {
  studioDark as mavisTheme_project_5924926a4049,
  studioLight as mavisTheme_project_cf1bd05232bc,
} from './shared/studio-theme'

const state = reactive({
  night: false as boolean,
  selected: 'one' as string,
  panes: [
    { id: 'one', title: 'First scene' },
    { id: 'two', title: 'Second scene' },
  ] as Pane[],
})
const toast = useToast()
</script>

<template>
  <MThemeProvider
    :theme="mavisTheme_project_cf1bd05232bc"
    :darkTheme="mavisTheme_project_5924926a4049"
    :appearance="state.night ? 'dark' : 'light'"
  >
    <MColumn gap="md">
      <MCarousel
        label="Studio scenes"
        :items="state.panes"
        :modelValue="state.selected"
        @update:modelValue="(value) => (state.selected = value)"
        :loop="true"
      >
        <template #default="{ item }">
          <MCard>
            <MText>{{ item.title }}</MText>
          </MCard>
        </template>
      </MCarousel>
      <MText>{{ `Selected ${state.selected}` }}</MText>
      <MButton
        :text="state.night ? 'Use daylight' : 'Use night'"
        @click="() => (state.night = !state.night)"
      />
      <MButton
        text="Show notice"
        @click="() => toast.show({ message: 'Theme notice', duration: 0 })"
      />
      <MToast :controller="toast" />
    </MColumn>
  </MThemeProvider>
</template>
