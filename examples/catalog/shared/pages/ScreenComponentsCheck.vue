<script setup lang="ts">
import { ref } from 'vue'
import HeaderClipCheck from './HeaderClipCheck.vue'
import CollapsibleHeaderDemo from '../demos/CollapsibleHeaderDemo.vue'
import RefreshControlDemo from '../demos/RefreshControlDemo.vue'
import ComposerDemo from '../demos/ComposerDemo.vue'
import SpeedDialDemo from '../demos/SpeedDialDemo.vue'
import PinInputDemo from '../demos/PinInputDemo.vue'
import AnimatedTextDemo from '../demos/AnimatedTextDemo.vue'
import TagInputDemo from '../demos/TagInputDemo.vue'
import AvatarGroupDemo from '../demos/AvatarGroupDemo.vue'
import SearchBarDemo from '../demos/SearchBarDemo.vue'
const demos = [
  HeaderClipCheck,
  CollapsibleHeaderDemo,
  RefreshControlDemo,
  ComposerDemo,
  SpeedDialDemo,
  PinInputDemo,
  AnimatedTextDemo,
  TagInputDemo,
  AvatarGroupDemo,
  SearchBarDemo,
]
const index = ref(0)
</script>
<template>
  <MScreen :scroll="index < demos.length">
    <MColumn padding="md" gap="lg">
      <MButton
        id="screen-components-next"
        text="Next specimen"
        @click="index = (index + 1) % (demos.length + 1)"
      />
      <component v-if="index < demos.length" :is="demos[index]" :key="index" lang="en" />
    </MColumn>
    <template v-if="index === demos.length" #overlay>
      <MComposer
        class="standalone-composer"
        verticalAlignment="bottom"
        label="Standalone editor"
        followKeyboard
      />
    </template>
  </MScreen>
</template>
