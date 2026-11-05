<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  component: { type: String, required: true },
  height: { type: Number, default: 340 },
})
const { lang } = useData()
const portuguese = computed(() => lang.value === 'pt-BR')
const theme = ref('mavis')
const height = ref(props.height)
const frame = ref(null)
const viewport = ref('full')
const revision = ref(0)
let sizeObserver
let mountObserver
const source = computed(
  () =>
    `/playground/#/preview/${props.component}?theme=${theme.value}&lang=${portuguese.value ? 'pt' : 'en'}`,
)

function disconnect() {
  sizeObserver?.disconnect()
  mountObserver?.disconnect()
}

function observePreview() {
  disconnect()
  const document = frame.value?.contentDocument
  if (!document || props.component === 'screen') return

  function observeContent() {
    const content = document.querySelector('[data-testid="component-preview"]')
    if (!content) return
    mountObserver.disconnect()
    sizeObserver = new ResizeObserver(() => {
      height.value = Math.max(props.height, Math.ceil(content.getBoundingClientRect().height))
    })
    sizeObserver.observe(content)
  }

  // The iframe can finish loading before Vue mounts the lazy route.
  mountObserver = new MutationObserver(observeContent)
  mountObserver.observe(document, { childList: true, subtree: true })
  observeContent()
}

onMounted(observePreview)
onBeforeUnmount(disconnect)
</script>

<template>
  <div class="component-preview vp-raw">
    <div class="component-preview-toolbar">
      <span class="preview-live"><i></i>{{ portuguese ? 'Prévia Web' : 'Web preview' }}</span>
      <div :aria-label="portuguese ? 'Tema da prévia' : 'Preview theme'" role="group">
        <button
          v-for="name in ['mavis', 'midnight']"
          :key="name"
          type="button"
          :aria-pressed="theme === name"
          @click="theme = name"
        >
          {{ name === 'mavis' ? 'Mavis' : 'Midnight' }}
        </button>
      </div>
    </div>
    <div class="preview-canvas" :class="{ 'preview-dark': theme === 'midnight' }">
      <div class="preview-viewport" :style="{ maxWidth: viewport === 'phone' ? '375px' : '100%' }">
        <iframe
          :key="revision"
          ref="frame"
          :src="source"
          :title="`${component} · ${portuguese ? 'exemplo interativo' : 'interactive example'}`"
          :style="{ height: `${height}px` }"
          loading="lazy"
          @load="observePreview"
        />
      </div>
    </div>
    <div class="preview-bottom-toolbar">
      <div role="group" :aria-label="portuguese ? 'Largura da prévia Web' : 'Web preview width'">
        <button type="button" :aria-pressed="viewport === 'full'" @click="viewport = 'full'">
          {{ portuguese ? 'Amplo' : 'Wide' }}</button
        ><button type="button" :aria-pressed="viewport === 'phone'" @click="viewport = 'phone'">
          375px
        </button>
      </div>
      <button
        type="button"
        @click="revision++"
        :aria-label="portuguese ? 'Reiniciar exemplo' : 'Reset example'"
      >
        ↻ {{ portuguese ? 'Reiniciar' : 'Reset' }}
      </button>
      <a :href="source" target="_blank" rel="noopener"
        >{{ portuguese ? 'Abrir exemplo' : 'Open example' }} ↗</a
      >
    </div>
  </div>
</template>

<style scoped>
.component-preview {
  margin: 28px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}
.preview-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.preview-live i {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4e7954;
}
.preview-canvas {
  background: #ecebe5;
  background-image: radial-gradient(#b3b2a759 0.7px, transparent 0.7px);
  background-size: 15px 15px;
  padding: 18px;
}
.preview-canvas.preview-dark {
  background-color: #27232e;
}
.preview-viewport {
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 7px;
  background: #fff;
  border: 1px solid #0000000c;
}
.preview-bottom-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  padding: 9px 16px;
  border-top: 1px solid var(--site-line);
  font-size: 11px;
}
.preview-bottom-toolbar > div {
  display: flex;
  gap: 3px;
  margin-right: auto;
}
.preview-bottom-toolbar a {
  color: var(--site-muted);
  text-decoration: none;
}
.preview-bottom-toolbar a:hover {
  color: var(--site-accent);
}
@media (max-width: 639px) {
  .preview-canvas {
    padding: 9px;
  }
  .preview-bottom-toolbar {
    gap: 8px;
    padding: 9px;
    font-size: 10px;
  }
}
.component-preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
}
.component-preview-toolbar > div {
  display: flex;
  gap: 4px;
}
button {
  padding: 4px 10px;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
button[aria-pressed='true'] {
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  box-shadow: 0 1px 3px #00000012;
}
button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
iframe {
  display: block;
  width: 100%;
  border: 0;
}
</style>
