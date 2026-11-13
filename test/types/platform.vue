<script setup lang="ts">
import {
  MPlatform,
  useMavisPlatform,
  useMavisListMotion,
  createMavisNavigation,
} from '@getcortexlabs/mavis-web'
import { MPlatform as NativePlatform } from '@getcortexlabs/mavis/vue'
import { createRouter, createMemoryHistory } from 'vue-router'
const { isNative, isMacOS, platform } = useMavisPlatform()
void (platform === 'macos')
const motion = useMavisListMotion({ size: false, transition: { duration: 200 } })
const router = createRouter({ history: createMemoryHistory(), routes: [] })
createMavisNavigation(router, { transition: { name: 'fade' } })
void motion
</script>
<template>
  <MPlatform only="web"
    ><MText>Web</MText><template #fallback><MText>Native</MText></template></MPlatform
  >
  <NativePlatform :only="['ios', 'android']"><MText>Native</MText></NativePlatform>
  <MButton v-if="isNative" text="Native action" />
  <MPlatform only="macos"><MText v-if="isMacOS">Mac</MText></MPlatform>
  <!-- @vue-expect-error platform is required -->
  <MPlatform />
  <!-- @vue-expect-error mobile browser is still Web -->
  <MPlatform only="mobile" />
</template>
