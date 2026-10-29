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
      <span>{{ portuguese ? 'Prévia Web' : 'Web preview' }}</span>
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
    <iframe
      ref="frame"
      :src="source"
      :title="`${component} · ${portuguese ? 'exemplo interativo' : 'interactive example'}`"
      :style="{ height: `${height}px` }"
      loading="lazy"
      @load="observePreview"
    />
  </div>
</template>

<style scoped>
.component-preview {
  margin: 28px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-top: 3px solid var(--vp-c-brand-1);
  border-radius: 20px;
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
