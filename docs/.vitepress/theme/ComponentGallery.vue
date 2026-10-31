<script setup>
import { computed, watch } from 'vue'
import { useData } from 'vitepress'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import ComponentArtwork from '../../../examples/catalog/shared/ComponentArtwork.vue'

const { lang, isDark } = useData()
const { setTheme } = useMavisTheme()
watch(isDark, (dark) => setTheme(dark ? midnight : mavis), { immediate: true })
const pt = computed(() => lang.value === 'pt-BR')
const prefix = computed(() => (pt.value ? '/pt-BR' : ''))
const groups = [
  {
    name: ['Essentials', 'Essenciais'],
    items: [
      ['button', 'Button', 'Actions with character.', 'Ações com personalidade.'],
      ['input', 'Input', 'Make it personal.', 'Do seu jeito.'],
      ['slider', 'Slider', 'Every value, just right.', 'Cada valor, no ponto.'],
      ['card', 'Card', 'Give your content a home.', 'Um lugar para seu conteúdo.'],
      ['text', 'Text', 'Set the tone.', 'Encontre o tom.'],
      ['icon', 'Icon', 'Say it with a symbol.', 'Diga com um símbolo.'],
    ],
  },
  {
    name: ['Composition', 'Composição'],
    items: [
      ['row', 'Row', 'Side by side.', 'Lado a lado.'],
      ['column', 'Column', 'A natural flow.', 'Conteúdo que flui.'],
      ['box', 'Box', 'Create another layer.', 'Crie outra camada.'],
      ['screen', 'Screen', 'Your starting point.', 'Seu ponto de partida.'],
      ['sheet', 'Sheet', 'Rise to the occasion.', 'Uma camada acima.'],
    ],
  },
  {
    name: ['Motion', 'Movimento'],
    items: [['reveal', 'Reveal', 'Make an entrance.', 'Uma entrada com presença.']],
  },
]
</script>

<template>
  <div class="component-gallery vp-raw">
    <div class="gallery-note">
      <span>{{ pt ? '12 componentes. Uma identidade.' : '12 components. One identity.' }}</span>
      <a :href="`${prefix}/guide/themes`">{{ pt ? 'Explore os temas' : 'Explore themes' }} ↗</a>
    </div>
    <section v-for="(group, index) in groups" :key="index">
      <div class="gallery-section-title">
        <h2>{{ group.name[pt ? 1 : 0] }}</h2>
        <span>0{{ index + 1 }} / 0{{ group.items.length }}</span>
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
            <span aria-hidden="true">↗</span>
          </div>
          <p>{{ pt ? br : en }}</p>
          <code>m-{{ id }}</code>
        </a>
      </div>
    </section>
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
  border-top: 3px solid var(--vp-c-brand-1);
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
  justify-content: space-between;
  align-items: center;
  padding: 14px 6px 4px;
}
.gallery-card-title h3 {
  margin: 0;
  font-size: 17px;
  letter-spacing: -0.02em;
}
.gallery-card-title > span {
  color: var(--vp-c-brand-1);
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
