<script setup lang="ts">
import { ref } from 'vue'
import CollapsibleHeaderDemo from '../demos/CollapsibleHeaderDemo.vue'
import RefreshControlDemo from '../demos/RefreshControlDemo.vue'
import ComposerDemo from '../demos/ComposerDemo.vue'
import SpeedDialDemo from '../demos/SpeedDialDemo.vue'
import PinInputDemo from '../demos/PinInputDemo.vue'
import AnimatedTextDemo from '../demos/AnimatedTextDemo.vue'
const demos = [
  CollapsibleHeaderDemo,
  RefreshControlDemo,
  ComposerDemo,
  SpeedDialDemo,
  PinInputDemo,
  AnimatedTextDemo,
]
const index = ref(0)
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="lg"
      ><MButton
        id="screen-components-next"
        text="Next specimen"
        @click="index = (index + 1) % demos.length" /><component
        :is="demos[index]"
        :key="index"
        lang="en" /></MColumn
  ></MScreen>
</template>
