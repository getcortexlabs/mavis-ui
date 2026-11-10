<script setup lang="ts">
import { onMounted, ref, shallowRef, nextTick } from 'vue'
import { knownFolders, type View } from '@nativescript/core'
import { fixtures } from './fixtures'
import { replay } from './probe'

const index = ref(0)
const host = shallowRef<{ nativeView: View }>()
const results: unknown[] = []
const write = (done: boolean) =>
  knownFolders
    .documents()
    .getFile('portable-report.json')
    .writeTextSync(JSON.stringify({ done, results }, null, 2))

onMounted(async () => {
  write(false)
  for (const [at, fixture] of fixtures.entries()) {
    index.value = at
    await nextTick()
    await new Promise((done) => setTimeout(done, 1200))
    try {
      results.push(await replay(fixture.name, fixture.steps, () => host.value!.nativeView))
    } catch (error) {
      results.push({ name: fixture.name, error: String(error) })
    }
    write(false)
  }
  write(true)
})
</script>

<template>
  <Frame>
    <MScreen scroll>
      <StackLayout ref="host" padding="24">
        <component :is="fixtures[index].component" :key="fixtures[index].name" />
      </StackLayout>
    </MScreen>
  </Frame>
</template>
