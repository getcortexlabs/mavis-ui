<script setup>
import { computed, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'
import {
  componentCategories,
  componentUpdates,
  statusLabel,
  statusDescription,
} from '../catalog.mjs'
import ComponentArtwork from '../../../examples/catalog/shared/ComponentArtwork.vue'

const { lang } = useData()
const pt = computed(() => lang.value === 'pt-BR')
const prefix = computed(() => (pt.value ? '/pt-BR' : ''))
const query = ref('')
const selected = ref('all')
const root = ref(null)
const count = componentCategories.reduce((total, group) => total + group.items.length, 0)
const slug = (value) => value.toLowerCase().replace(/[^a-z]+/g, '-')
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
const groups = computed(() =>
  componentCategories
    .filter((group) => selected.value === 'all' || selected.value === group.name[0])
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        normalize(item.join(' ')).includes(normalize(query.value.trim())),
      ),
    }))
    .filter((group) => group.items.length),
)
const results = computed(() => groups.value.reduce((total, group) => total + group.items.length, 0))
const motion = useWebMotion(root)
let ready = false
motion.use(() => {
  ready = true
  return () => {
    ready = false
  }
})
watch([query, selected], () => {
  if (ready) motion.animateLayout({ duration: 450, bounce: 0.08, size: false })
})
function reset() {
  query.value = ''
  selected.value = 'all'
}
</script>

<template>
  <div class="component-gallery vp-raw">
    <div class="gallery-search">
      <span aria-hidden="true">⌕</span>
      <label class="visually-hidden" for="component-search">{{
        pt ? 'Buscar componentes' : 'Search components'
      }}</label>
      <input
        id="component-search"
        v-model="query"
        type="search"
        :placeholder="pt ? 'Encontre sua próxima peça…' : 'Find your next building block…'"
        @keydown.esc="reset"
      />
      <span>{{ count }}</span>
    </div>
    <div
      class="gallery-filters"
      role="group"
      :aria-label="pt ? 'Categorias de componentes' : 'Component categories'"
    >
      <button type="button" :aria-pressed="selected === 'all'" @click="selected = 'all'">
        {{ pt ? 'Todos' : 'All' }} <small>{{ count }}</small>
      </button>
      <button
        v-for="category in componentCategories"
        :key="category.name[0]"
        type="button"
        :aria-pressed="selected === category.name[0]"
        @click="selected = category.name[0]"
      >
        {{ category.name[pt ? 1 : 0] }} <small>{{ category.items.length }}</small>
      </button>
    </div>
    <div class="gallery-note">
      <span role="status">{{
        pt
          ? `${results} componentes. Possibilidades sem fim.`
          : `${results} components. Endless possibility.`
      }}</span>
      <a :href="`${prefix}/guide/themes`">{{ pt ? 'Explore os temas' : 'Explore themes' }} ↗</a>
    </div>
    <div ref="root" class="gallery-results">
      <section v-for="group in groups" :id="slug(group.name[0])" :key="group.name[0]">
        <div class="gallery-section-title">
          <h2>{{ group.name[pt ? 1 : 0] }}</h2>
          <span>{{ group.items.length }}</span>
        </div>
        <div class="gallery-grid">
          <a
            v-for="[id, name, en, br] in group.items"
            :key="id"
            class="gallery-card"
            :href="`${prefix}/components/${id}`"
          >
            <ComponentArtwork :id="id" />
            <div class="gallery-card-title">
              <h3>{{ name }}</h3>
              <span
                v-if="componentUpdates[id]"
                class="catalog-status"
                :class="componentUpdates[id]"
                :title="statusDescription(id, pt)"
                >{{ statusLabel(id, pt) }}</span
              >
              <span aria-hidden="true">↗</span>
            </div>
            <p>{{ pt ? br : en }}</p>
            <code>{{ id === 'radio' ? 'm-radio-group' : `m-${id}` }}</code>
          </a>
        </div>
      </section>
    </div>
    <div v-if="!results" class="gallery-empty">
      <span aria-hidden="true">✳</span>
      <h2>{{ pt ? 'Ainda não encontramos essa peça.' : 'We haven’t found that piece yet.' }}</h2>
      <p>
        {{
          pt
            ? 'Tente outro nome ou explore a coleção inteira.'
            : 'Try another name, or explore the whole collection.'
        }}
      </p>
      <button type="button" @click="reset">
        {{ pt ? 'Ver todos os componentes' : 'Show all components' }} ↗
      </button>
    </div>
    <a class="gallery-showcase" :href="`${prefix}/showcase/`">
      <span class="gallery-showcase-mark" aria-hidden="true">✦</span>
      <span
        ><small>SHOWCASE</small
        ><strong>{{ pt ? 'Veja tudo ganhar vida.' : 'See it all come to life.' }}</strong></span
      >
      <span aria-hidden="true">↗</span>
    </a>
  </div>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.gallery-search {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 18px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--site-line);
  border-radius: 8px;
}
.gallery-search > span:first-child {
  font-size: 27px;
  color: var(--site-muted);
}
.gallery-search > span:last-child {
  font-size: 11px;
  color: var(--site-muted);
}
.gallery-search input {
  flex: 1;
  min-width: 0;
  width: 100%;
  background: transparent;
  font-size: 14px;
  color: var(--site-ink);
  outline: none;
}
.gallery-search:focus-within {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
}
.gallery-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 20px 0;
}
.gallery-filters button {
  cursor: pointer;
  padding: 7px 11px;
  border: 1px solid transparent;
  border-radius: 5px;
  font-size: 11px;
  color: var(--site-muted);
}
.gallery-filters button[aria-pressed='true'] {
  border-color: var(--site-line);
  background: var(--vp-c-bg-soft);
  color: var(--site-ink);
}
.gallery-filters small {
  font-size: 8px;
  margin-left: 5px;
}
.gallery-filters button:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
}
.gallery-empty {
  text-align: center;
  padding: 50px 20px;
}
.gallery-empty > span {
  color: var(--site-accent);
  font-size: 48px;
}
.gallery-empty h2 {
  font-family: var(--site-serif);
  font-size: 28px;
  font-weight: 400;
  border: none;
}
.gallery-empty p {
  color: var(--site-muted);
  font-size: 13px;
}
.gallery-empty button {
  cursor: pointer;
  color: var(--site-accent);
  font-size: 13px;
  padding: 8px 12px;
}
.component-gallery a {
  text-decoration: none;
}
.component-gallery {
  margin: 28px 0 40px;
}
.gallery-note {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 0;
  border-top: 1px solid var(--site-line);
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.gallery-note a {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.gallery-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32px 0 16px;
}
.gallery-section-title h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 20px;
  letter-spacing: -0.025em;
}
.gallery-section-title > span {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--vp-c-text-3);
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.gallery-card {
  display: block;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 22px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition:
    border-color 0.18s,
    transform 0.18s,
    box-shadow 0.18s;
}
.gallery-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
  box-shadow: 0 10px 28px #4c24400c;
}
.gallery-card:focus-visible,
.gallery-showcase:focus-visible {
  outline: 3px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}
.gallery-card-title {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: space-between;
  align-items: center;
  padding: 14px 6px 4px;
}
.gallery-card-title h3 {
  margin: 0;
  font-size: 17px;
  letter-spacing: -0.02em;
  min-width: 0;
  overflow-wrap: anywhere;
}
.gallery-card-title > span[aria-hidden] {
  color: var(--vp-c-brand-1);
}
.gallery-card-title .catalog-status {
  order: 3;
}
.gallery-card p {
  margin: 0 6px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
.gallery-card code {
  display: block;
  margin: 0 6px 6px;
  background: none;
  padding: 0;
  font-size: 10px;
  white-space: normal;
  overflow-wrap: anywhere;
  color: var(--vp-c-brand-1);
}
.gallery-showcase {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 32px;
  padding: 24px;
  border-radius: 20px;
  background: var(--vp-c-tip-soft);
  color: var(--vp-c-text-1);
}
.gallery-showcase-mark {
  font-size: 42px;
  color: var(--vp-c-tip-1);
}
.gallery-showcase > span:nth-child(2) {
  flex: 1;
}
.gallery-showcase small {
  display: block;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--vp-c-tip-1);
}
.gallery-showcase strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
  line-height: 1.4;
  letter-spacing: -0.025em;
}
@media (max-width: 380px) {
  .gallery-grid {
    gap: 10px;
  }
  .gallery-card {
    padding: 6px;
    border-radius: 18px;
  }
  .gallery-card-title h3 {
    font-size: 15px;
  }
  .gallery-card p {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .gallery-card {
    transition: none;
  }
  .gallery-card:hover {
    transform: none;
  }
}
</style>
