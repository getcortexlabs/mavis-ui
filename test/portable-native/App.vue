<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, nextTick } from 'vue'
import { Frame, knownFolders, type View } from '@nativescript/core'
import { fixtures } from './fixtures'
import { replay } from './probe'

const index = ref(0)
const fixture = computed(() => fixtures[index.value]!)
const host = shallowRef<{ nativeView: View }>()
const results: unknown[] = []
const write = (done: boolean) =>
  knownFolders
    .documents()
    .getFile('portable-report.json')
    .writeTextSync(JSON.stringify({ done, results }, null, 2))

onMounted(async () => {
  write(false)
  for (const [at, current] of fixtures.entries()) {
    index.value = at
    await nextTick()
    await new Promise((done) => setTimeout(done, 1200))
    // A screen is the page the frame shows; any other fixture is in the host page's column.
    const root = () =>
      current.screen ? (Frame.topmost().currentPage as unknown as View) : host.value!.nativeView
    try {
      results.push(await replay(current.name, current.steps, root))
    } catch (error) {
      results.push({ name: current.name, error: String(error) })
    }
    write(false)
  }
  write(true)
})
</script>

<template>
  <Frame>
    <component :is="fixture.component" v-if="fixture.screen" :key="fixture.name" />
    <MScreen v-else key="host" scroll>
      <StackLayout ref="host" padding="24">
        <component :is="fixture.component" :key="fixture.name" />
      </StackLayout>
    </MScreen>
  </Frame>
</template>
