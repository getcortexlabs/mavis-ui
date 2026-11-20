<script setup lang="ts">
import { ref } from 'vue'
const taps = ref(0)
const overlayTaps = ref(0)
const bottomTaps = ref(0)
const nested = ref(true)
const blocked = ref(false)
</script>
<template>
  <MScreen id="touch-screen" scroll>
    <MColumn padding="lg" gap="md">
      <MText variant="heading">Touch through decorative layers</MText>
      <MButton id="touch-under" text="Touch underneath" @click="taps++" />
      <MText id="touch-count">Underneath {{ taps }}</MText>
      <MText id="touch-overlay-count">Overlay taps {{ overlayTaps }}</MText>
      <MButton id="touch-replace" text="Replace decorative layer" @click="nested = !nested" />
      <MBox id="touch-box" :width="200" :height="100" padding="sm" backgroundColor="#E9DDF7">
        <MColumn id="touch-fill" />
        <MColumn id="touch-fixed" :width="60" :height="30" backgroundColor="#202C25" />
        <MColumn id="touch-percent" width="50%" :height="10" />
      </MBox>
      <MBox id="touch-text-box" :width="200" :height="80" backgroundColor="#FFFFFF">
        <MText id="touch-text" :style="{ color: '#000000' }">Plain text layer</MText>
      </MBox>
      <MColumn :height="1000" />
      <MButton id="touch-bottom" text="Touch after scrolling" @click="bottomTaps++" />
      <MText id="touch-bottom-count">Bottom {{ bottomTaps }}</MText>
    </MColumn>
    <template #overlay>
      <MBox
        id="touch-overlay"
        :key="String(blocked)"
        v-bind="blocked ? { isPassThroughParentEnabled: false } : {}"
      >
        <MColumn v-if="nested" id="touch-decoration" />
        <MBox v-else id="touch-decoration-replaced"><MColumn /></MBox>
        <MColumn padding="md" align="end" justify="end">
          <MButton
            id="touch-baseline"
            text="Toggle old hit testing"
            :style="{ pointerEvents: 'auto' }"
            @click="blocked = !blocked"
          />
          <MButton
            id="touch-overlay-action"
            :style="{ pointerEvents: 'auto' }"
            :text="'Overlay ' + overlayTaps"
            @click="overlayTaps++"
          />
        </MColumn>
      </MBox>
    </template>
  </MScreen>
</template>
