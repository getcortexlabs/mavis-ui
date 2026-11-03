<script setup lang="ts">
import { computed, markRaw, nextTick, ref, watch } from 'vue'
import { createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { requestMavisWebHaptic, useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import { MBox, MButton, MColumn, MRow, MText } from '@getcortexlabs/mavis-web'
import {
  resolveListTarget,
  type WebNavigationEntry,
  type WebZoomable,
} from '@rafaelaugusto/jolt/web'
import { formaImage } from '../../catalog/shared/assets/forma-image'
import { avatarImage } from '../../catalog/shared/assets/avatar-image'

const props = withDefaults(
  defineProps<{
    selected?: string
    navigate: (key: string | undefined, signal?: AbortSignal) => Promise<unknown>
    locale?: 'en' | 'pt'
  }>(),
  { locale: 'en' },
)
const pt = computed(() => props.locale === 'pt')
const all = Array.from({ length: 18 }, (_, index) => ({
  key: `photo-${index}`,
  src: index % 2 ? avatarImage : formaImage,
  title: `Study ${index + 1}`,
}))
const photos = ref([...all]),
  page = ref(0),
  busy = ref(false),
  status = ref('idle'),
  reason = ref(''),
  error = ref('')
const visible = computed(() => photos.value.slice(page.value * 6, page.value * 6 + 6))
const current = computed(() => all.find((photo) => photo.key === props.selected))
const region = markRaw(createMotionRegion()),
  heading = ref<HTMLElement>(),
  list = ref<HTMLElement>()
const detail = ref<HTMLImageElement>(),
  viewport = ref<HTMLElement>(),
  toolbar = ref<HTMLElement>()
const glassBackend = ref(''),
  feedback = ref(''),
  zoomed = ref(false),
  glassAmount = ref(0.7),
  ready = ref(false)
let openPhoto: ((key: string) => Promise<void>) | undefined, goBack: (() => void) | undefined
let zoom: WebZoomable | undefined, changeGlass: (() => void) | undefined
const thumbnail = (key: string) =>
  list.value?.querySelector<HTMLImageElement>(`[data-photo-key="${key}"]`) ?? undefined
useMavisWebMotion(region, (scope, element) => {
  let active = true,
    entry: WebNavigationEntry | undefined
  const glass = scope.glass(toolbar.value!, {
    amount: 0.7,
    tint: 'rgba(30,38,58,0.75)',
    fallbackColor: '#202638',
  })
  glassBackend.value = glass.snapshot().backend
  changeGlass = () => {
    glassAmount.value = glassAmount.value > 0.5 ? 0.2 : 0.8
    scope.add(glass.animate(glassAmount.value, { duration: 400 }))
    glassBackend.value = glass.snapshot().backend
  }
  const finish = (result: { status: string; reason?: string }) => {
    if (active) {
      status.value = result.status
      reason.value = result.reason ?? ''
      busy.value = false
    }
  }
  const fail = (reason: unknown) => {
    if (active) {
      error.value = String(reason)
      busy.value = false
    }
  }
  openPhoto = async (key) => {
    if (busy.value) return
    busy.value = true
    error.value = ''
    status.value = 'opening'
    try {
      await thumbnail(key)?.decode()
      if (!active) return
      entry?.dispose()
      entry = scope.sharedNavigationEntry(element, {
        tag: key,
        source: () => thumbnail(key),
        detail: () => detail.value,
        transition: { duration: 450, bounce: 0 },
        async back({ signal }) {
          if (signal.aborted) return false
          await props.navigate(undefined, signal)
          await nextTick()
        },
        returnTarget: {
          key,
          fallbackFocus: () => heading.value,
          resolve: (context) =>
            resolveListTarget(context, {
              container: element,
              indexOf: (key) => photos.value.findIndex((photo) => photo.key === key),
              async scrollToIndex(index, { signal }) {
                if (signal.aborted) return
                page.value = Math.floor(index / 6)
                await nextTick()
                if (!signal.aborted) await thumbnail(context.key)?.decode()
              },
              viewForKey: thumbnail,
              keyOf: (target) => target.dataset.photoKey,
            }),
        },
      })
      finish(
        await entry.open(async ({ signal }) => {
          if (signal.aborted) return false
          await props.navigate(key, signal)
          await nextTick()
          if (!signal.aborted) await detail.value?.decode()
        }),
      )
    } catch (reason) {
      fail(reason)
    }
  }
  goBack = () => {
    if (busy.value) return
    busy.value = true
    if (entry) void entry.back().then(finish, fail)
    else void props.navigate(undefined).then(() => finish({ status: 'completed' }), fail)
  }
  const stop = watch(
    [detail, busy],
    ([image, pending], _, cleanup) => {
      zoom = undefined
      zoomed.value = false
      if (!image || !viewport.value || pending) return
      const controller = scope.zoomable(image, {
        viewport: viewport.value,
        scale: [1, 3],
        onSettled: (state) => {
          zoomed.value = state.scale > 1.01
        },
        onError: fail,
        onDismiss(intent) {
          if (!entry || busy.value) {
            intent.cancel()
            return
          }
          busy.value = true
          void entry.returnFrom(intent).then(finish, fail)
        },
      })
      zoom = controller
      cleanup(() => {
        controller.dispose()
        if (zoom === controller) zoom = undefined
      })
    },
    { immediate: true, flush: 'post' },
  )
  ready.value = true
  return () => {
    active = false
    stop()
    entry?.dispose()
    ready.value = busy.value = false
    openPhoto = goBack = changeGlass = undefined
  }
})
function haptic() {
  const result = requestMavisWebHaptic(region, 'light')
  feedback.value = `${result.backend}: ${result.status}`
}
</script>
<template>
  <MBox :motionRegion="region" class="gallery-scene">
    <MColumn gap="md">
      <MText variant="overline" tone="accent">22 / GALLERY</MText>
      <h1 ref="heading" id="gallery-heading" tabindex="-1">
        {{ pt ? 'Encontre outro olhar.' : 'Find another perspective.' }}
      </h1>
      <div ref="toolbar" class="gallery-toolbar">
        <MButton
          id="gallery-glass"
          variant="secondary"
          :disabled="!ready"
          @click="changeGlass?.()"
          >{{ pt ? 'Ajustar vidro' : 'Adjust glass' }}</MButton
        >
        <MButton id="gallery-haptic" variant="secondary" :disabled="!ready" @click="haptic">{{
          pt ? 'Resposta tátil' : 'Request haptic'
        }}</MButton>
        <span id="gallery-glass-backend">{{ glassBackend }}</span
        ><span id="gallery-feedback">{{ feedback }}</span>
      </div>
      <div class="gallery-stage">
        <div v-if="!current" ref="list" class="gallery-grid" id="gallery-list">
          <button
            v-for="photo in visible"
            :key="photo.key"
            :data-open-photo="photo.key"
            :disabled="!ready"
            :aria-disabled="busy || undefined"
            @click="openPhoto?.(photo.key)"
          >
            <img
              :data-photo-key="photo.key"
              :src="photo.src"
              :alt="photo.title"
              width="160"
              height="120"
            />
            <span>{{ photo.title }}</span>
          </button>
        </div>
        <div v-else ref="viewport" id="gallery-viewer" class="gallery-viewport">
          <img ref="detail" id="gallery-photo" :src="current.src" :alt="current.title" />
        </div>
      </div>
      <MRow gap="sm" wrap class="gallery-actions">
        <template v-if="current">
          <MButton id="gallery-back" :disabled="busy" @click="goBack?.()">{{
            pt ? 'Voltar' : 'Back'
          }}</MButton>
          <MButton
            id="gallery-zoom"
            variant="secondary"
            :disabled="busy"
            @click="zoomed ? zoom?.reset() : zoom?.zoomTo(2)"
            >{{ zoomed ? '100%' : '200%' }}</MButton
          >
          <MButton id="gallery-reorder" variant="secondary" @click="photos.reverse()">{{
            pt ? 'Inverter coleção' : 'Reverse collection'
          }}</MButton>
          <MButton
            id="gallery-delete"
            variant="ghost"
            @click="photos = photos.filter((photo) => photo.key !== selected)"
            >{{ pt ? 'Remover da coleção' : 'Remove from collection' }}</MButton
          >
        </template>
        <template v-else>
          <MButton
            id="gallery-previous"
            variant="secondary"
            :disabled="page === 0 || busy"
            @click="page--"
            >{{ pt ? 'Anterior' : 'Previous' }}</MButton
          >
          <MButton
            id="gallery-next"
            variant="secondary"
            :disabled="(page + 1) * 6 >= photos.length || busy"
            @click="page++"
            >{{ pt ? 'Próxima' : 'Next' }}</MButton
          >
        </template>
      </MRow>
      <MText id="gallery-status" :data-reason="reason" variant="caption">{{ status }}</MText>
      <MText v-if="error" id="gallery-error">{{ error }}</MText>
    </MColumn>
  </MBox>
</template>
<style scoped>
.gallery-scene {
  max-width: 720px;
  margin: auto;
  overflow-anchor: none;
}
.gallery-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  color: white;
  background-image: linear-gradient(120deg, #4262c422, #b8367022);
}
.gallery-stage {
  height: 420px;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.gallery-grid button {
  cursor: pointer;
  color: inherit;
  background: transparent;
  border: 1px solid #7775;
  border-radius: 12px;
  padding: 8px;
}
.gallery-grid img {
  display: block;
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
}
.gallery-viewport {
  position: relative;
  width: 100%;
  height: 420px;
  overflow: hidden;
  background: #202638;
  border-radius: 20px;
}
.gallery-viewport img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.gallery-actions {
  min-height: 188px;
}
</style>
