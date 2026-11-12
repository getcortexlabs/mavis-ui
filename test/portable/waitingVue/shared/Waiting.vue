<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MRow, MText } from '#mavis'

const count = ref(0)
const busy = ref(false)
const offline = ref(false)
const note = ref('Nothing yet')

async function verify() {
  if (offline.value) throw new Error('Offline')
  count.value += 1
}
async function check() {
  busy.value = true
  note.value = 'Checking'
  try {
    await verify()
    await verify()
    note.value = `Checked ${count.value}`
  } catch (error) {
    note.value = 'Check failed'
  } finally {
    busy.value = false
  }
}
const attempt = async () => {
  try {
    await verify()
  } finally {
    note.value = `Tried ${count.value}`
  }
}
async function guarded() {
  try {
    await attempt()
  } catch {
    note.value = `${note.value}, caught`
  }
}
function start() {
  check()
}
</script>

<template>
  <MColumn gap="md">
    <MText>Count {{ count }}</MText>
    <MText>{{ busy ? 'Busy' : 'Ready' }}</MText>
    <MText>{{ note }}</MText>
    <MRow gap="sm" wrap>
      <MButton @click="check">Check</MButton>
      <MButton @click="start">Start</MButton>
      <MButton @click="guarded">Try</MButton>
      <MButton @click="offline = !offline">{{ offline ? 'Go online' : 'Go offline' }}</MButton>
    </MRow>
  </MColumn>
</template>
