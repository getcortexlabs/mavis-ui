<script setup lang="ts">
import { markRaw, nextTick, ref, watch } from 'vue'
import { createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import { MBox, MButton, MColumn, MRow, MText } from '@getcortexlabs/mavis-web'

const props = withDefaults(
  defineProps<{
    detail: boolean
    navigate: (detail: boolean) => Promise<unknown>
    locale?: 'en' | 'pt'
  }>(),
  { locale: 'en' },
)
const region = markRaw(createMotionRegion())
const hero = ref<HTMLElement>(),
  story = ref<HTMLElement>(),
  ready = ref(false),
  busy = ref(false),
  status = ref('idle')
let travel: (() => void) | undefined, cancel: (() => void) | undefined
let back: (() => void) | undefined
const backState = ref('idle')
useMavisWebMotion(region, (scope, element) => {
  const stopBack = watch(
    [story, () => props.detail],
    ([target, detail], _, cleanup) => {
      back = undefined
      if (!target || !detail) return
      const control = scope.interactiveNavigation(target, {
        canBegin: () => !busy.value,
        onState: (value) => {
          backState.value = value
        },
        async commit({ signal }) {
          if (signal.aborted) return false
          await props.navigate(false)
          await nextTick()
        },
      })
      back = () => control.back()
      cleanup(() => {
        control.dispose()
        back = undefined
      })
    },
    { immediate: true, flush: 'post' },
  )
  const navigation = scope.sharedNavigation(element, {
    transition: { duration: 650, bounce: 0 },
    navigationTimeout: 5000,
  })
  let detach: (() => void) | undefined
  const stop = watch(
    hero,
    (target) => {
      detach?.()
      detach = target ? navigation.attach(target, 'coast') : undefined
    },
    { immediate: true, flush: 'post' },
  )
  let active = true
  travel = () => {
    if (busy.value) return
    busy.value = true
    const destination = !props.detail
    const operation = navigation.navigate({
      tag: 'coast',
      async navigate() {
        await props.navigate(destination)
        await nextTick()
      },
    })
    cancel = () => operation.cancel()
    void operation.finished.then((result) => {
      if (active) {
        busy.value = false
        status.value = result.status
        cancel = undefined
      }
    })
  }
  ready.value = true
  return () => {
    active = false
    stop()
    stopBack()
    detach?.()
    ready.value = busy.value = false
    travel = cancel = undefined
  }
})
</script>
<template>
  <MBox :motionRegion="region" class="passage-scene">
    <MColumn gap="lg">
      <MText variant="overline" tone="accent">20 / PASSAGE</MText>
      <MText as="h1" variant="display">{{
        locale === 'pt' ? 'O caminho também importa.' : 'The journey matters too.'
      }}</MText>
      <section
        ref="story"
        :key="String(detail)"
        :class="['passage-story', { 'passage-detail': detail }]"
      >
        <div ref="hero" class="passage-art" aria-hidden="true"><i /><b /></div>
        <MText variant="title">{{
          locale === 'pt' ? 'A costa tranquila' : 'The quiet coast'
        }}</MText>
        <MText v-if="detail" id="passage-detail">{{
          locale === 'pt'
            ? 'Um lugar para olhar o mar e deixar o tempo passar.'
            : 'A place to watch the sea and let time pass.'
        }}</MText>
      </section>
      <MRow gap="sm" wrap>
        <MButton id="passage-travel" :disabled="!ready || busy" @click="travel?.()">{{
          detail ? (locale === 'pt' ? 'Voltar' : 'Back') : locale === 'pt' ? 'Explorar' : 'Explore'
        }}</MButton>
        <MButton v-if="busy" id="passage-cancel" variant="secondary" @click="cancel?.()">{{
          locale === 'pt' ? 'Interromper movimento' : 'Stop motion'
        }}</MButton>
        <MButton
          v-if="detail"
          id="passage-edge-back"
          variant="secondary"
          :disabled="busy"
          @click="back?.()"
          >{{ locale === 'pt' ? 'Voltar com gesto' : 'Gesture back' }}</MButton
        >
      </MRow>
      <MText id="passage-status" variant="caption" :accessibilityHidden="true">{{ status }}</MText>
      <MText id="passage-back-status" variant="caption" :accessibilityHidden="true">{{
        backState
      }}</MText>
    </MColumn>
  </MBox>
</template>
<style scoped>
.passage-scene {
  overflow-anchor: none;
  width: 100%;
  max-width: 720px;
  margin: auto;
}
.passage-story {
  min-height: 430px;
  display: grid;
  gap: 16px;
}
.passage-art {
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 120px;
  border-radius: 16px;
  background: #cfdae9;
}
.passage-detail .passage-art {
  width: 100%;
  height: 300px;
  border-radius: 28px;
}
.passage-art i {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff3dd;
  left: 12%;
  top: 12%;
}
.passage-art b {
  position: absolute;
  width: 130%;
  height: 70%;
  border-radius: 50%;
  background: #4262c4;
  left: -15%;
  top: 65%;
}
</style>
