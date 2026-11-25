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
  <MColumn v-if="index === demos.length" justify="end">
    <MButton id="screen-components-next" text="Next specimen" @click="index = 0" />
    <MComposer class="standalone-composer" label="Standalone editor" followKeyboard />
  </MColumn>
  <MScreen v-else scroll
    ><MColumn padding="md" gap="lg"
      ><MButton id="screen-components-next" text="Next specimen" @click="index++" /><component
        :is="demos[index]"
        :key="index"
        lang="en" /></MColumn
  ></MScreen>
</template>
