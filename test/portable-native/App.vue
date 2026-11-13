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
let active: { fixture?: string; phase: string; step?: number } = { phase: 'mounted' }
const write = (done: boolean) =>
  knownFolders
    .documents()
    .getFile('portable-report.json')
    .writeTextSync(
      JSON.stringify({ done, updatedAt: new Date().toISOString(), active, results }, null, 2),
    )
const phase = (value: string) => {
  active.phase = value
  write(false)
}
async function flushView() {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      nextTick(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Vue view flush did not finish within 10 seconds')),
          10000,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

// A fixture with a route table runs on the app's router, with its own routes only.
const table = computed(() => tables[fixture.value.name])
let installed: (() => void)[] = []
async function run() {
  for (const [at, current] of fixtures.entries()) {
    active = { fixture: current.name, phase: 'preparing' }
    write(false)
    try {
      for (const remove of installed) remove()
      installed = (tables[current.name]?.routes ?? []).map((route) => router!.addRoute(route))
      navigate(
        tables[current.name] && {
          router: router!,
          destinations: tables[current.name]!.destinations,
        },
      )
      index.value = at
      phase('nextTick')
      await flushView()
      phase('settling')
      await new Promise((done) => setTimeout(done, 1200))
      // A screen is the page the frame shows; any other fixture is in the host page's column.
      const root = () =>
        current.screen ? (Frame.topmost().currentPage as unknown as View) : host.value!.nativeView
      phase('replaying')
      results.push(
        await replay(current.name, current.steps, root, (step) => {
          active.step = step
          write(false)
        }),
      )
    } catch (error) {
      results.push({
        name: current.name,
        phase: active.phase,
        step: active.step,
        error: String(error),
      })
      // A stuck initial/render flush is a host failure, not 250 independent fixture failures.
      if (active.phase === 'nextTick') {
        active.phase = 'failed'
        write(true)
        return
      }
    }
    active.phase = 'finished'
    write(false)
  }
  active = { phase: 'complete' }
  write(true)
}

onMounted(() => {
  // NativeScript-Vue mounts synchronously before startApp enters Application.run.
  // Schedule the driver on the native event loop instead of awaiting the initial
  // Vue flush from inside its own startup mounted hook.
  phase('scheduled')
  setTimeout(() => {
    void run().catch((error) => {
      results.push({ name: active.fixture ?? 'startup', phase: active.phase, error: String(error) })
      active.phase = 'failed'
      write(true)
    })
  }, 0)
})
</script>

<template>
  <!-- Keep a native parent when switching between plain and router-owned Frames. -->
  <GridLayout>
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
  </GridLayout>
</template>
