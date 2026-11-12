<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, nextTick } from 'vue'
import { Frame, knownFolders, type View } from '@nativescript/core'
import { fixtures } from './fixtures'
import { RouterView, router, tables } from './navigation'
import { navigate, replay } from './probe'

const index = ref(0)
const fixture = computed(() => fixtures[index.value]!)
const host = shallowRef<{ nativeView: View }>()
const results: unknown[] = []
const write = (done: boolean) =>
  knownFolders
    .documents()
    .getFile('portable-report.json')
    .writeTextSync(JSON.stringify({ done, results }, null, 2))

// A fixture with a route table runs on the app's router, with its own routes only.
const table = computed(() => tables[fixture.value.name])
let installed: (() => void)[] = []
onMounted(async () => {
  write(false)
  for (const [at, current] of fixtures.entries()) {
    for (const remove of installed) remove()
    installed = (tables[current.name]?.routes ?? []).map((route) => router!.addRoute(route))
    navigate(
      tables[current.name] && { router: router!, destinations: tables[current.name]!.destinations },
    )
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
  <!-- A route table is the stack itself: vue-router-ns shows its pages. -->
  <RouterView v-if="table" :key="fixture.name" initial="/" />
  <Frame v-else>
    <component :is="fixture.component" v-if="fixture.screen" :key="fixture.name" />
    <MScreen v-else key="host" scroll>
      <StackLayout ref="host" padding="24">
        <component :is="fixture.component" :key="fixture.name" />
      </StackLayout>
    </MScreen>
  </Frame>
</template>
