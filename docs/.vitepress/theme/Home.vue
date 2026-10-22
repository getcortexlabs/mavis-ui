<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('components')
const saved = ref(false)
const quiet = ref(true)
const palette = ref('forest')
const cast = ref(0)
const sheet = ref(null)
const tabs = [
  { id: 'components', number: '01', label: 'The components' },
  { id: 'motion', number: '02', label: 'The movement' },
  { id: 'themes', number: '03', label: 'The character' }
]
const palettes = {
  forest: { name: 'Forest', accent: '#345c46', pale: '#e9eee2', soft: '#b7c5a0' },
  dusk: { name: 'Dusk', accent: '#765a76', pale: '#eee7ee', soft: '#c9b6c8' },
  amber: { name: 'Amber', accent: '#8a5a32', pale: '#f3eadb', soft: '#d5bb90' }
}
const currentPalette = computed(() => palettes[palette.value])
const previewStyle = computed(() => ({ '--demo-accent': currentPalette.value.accent, '--demo-pale': currentPalette.value.pale, '--demo-soft': currentPalette.value.soft }))

function selectTab(id) {
  activeTab.value = id
}
function moveTab(event, index) {
  const keys = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: tabs.length - 1 - index }
  if (!(event.key in keys)) return
  event.preventDefault()
  const next = (index + keys[event.key] + tabs.length) % tabs.length
  activeTab.value = tabs[next].id
  event.currentTarget.parentElement.children[next].focus()
}
</script>

<template>
  <div class="mavis-home">
    <a class="skip" href="#main">Skip to content</a>
    <svg class="svg-definitions" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <symbol id="mavis-wing" viewBox="0 0 48 48">
          <path d="M24 39C10 34 5 21 6 8c7 3 13 8 18 16C29 16 35 11 42 8c1 13-4 26-18 31Z" fill="currentColor"/>
          <path d="m12 16 12 18 12-18M9 25l15 9 15-9" fill="none" stroke="var(--wing-detail, #f7f5ec)" stroke-width="1.5" stroke-linecap="round"/>
        </symbol>
        <symbol id="spark" viewBox="0 0 32 32"><path d="M16 2c0 9-5 14-14 14 9 0 14 5 14 14 0-9 5-14 14-14-9 0-14-5-14-14Z" fill="currentColor"/></symbol>
      </defs>
    </svg>

    <header class="site-header shell">
      <a href="#" class="brand" aria-label="Mavis UI home"><svg aria-hidden="true"><use href="#mavis-wing"/></svg><span>mavis<span class="ui">ui</span></span></a>
      <nav aria-label="Main navigation"><a href="#workbench">The workbench</a><a href="#story">Our story</a></nav>
      <a class="github-link" href="https://github.com/getcortexlabs/mavis-ui">Follow on GitHub <span aria-hidden="true">↗</span></a>
    </header>

    <main id="main">
      <section class="hero">
        <img class="hero-art" src="/images/mavis-forest.webp" alt="Mavis with flowing golden hair and feather ornaments, reading in a sunlit forest." fetchpriority="high" width="1536" height="1024">
        <div class="hero-wash" aria-hidden="true"></div>
        <div class="hero-content shell">
          <div class="chapter"><span class="chapter-line"></span> CHAPTER ONE <span class="chapter-dot">·</span> A NEW NATIVE UI LIBRARY</div>
          <h1>A little magic.<br><em>Entirely native.</em></h1>
          <p class="hero-description">Beautiful components. Movement with meaning.<br>A little more wonder in the apps we build.</p>
          <p class="hero-platform">Made for NativeScript. Starting with Vue.</p>
          <div class="hero-actions"><a class="button primary" href="#workbench">Explore the workbench <span aria-hidden="true">↗</span></a><a class="quiet-link" href="https://github.com/getcortexlabs/mavis-ui">Watch it take shape <span aria-hidden="true">→</span></a></div>
          <div class="development"><span></span> Taking root. Not released yet.</div>
        </div>
        <div class="art-note"><span class="art-note-line"></span><span>A little imagination<br>goes a long way.</span><svg aria-hidden="true"><use href="#spark"/></svg></div>
        <div class="hero-bottom shell"><span>CRAFTED WITH CARE. BUILT TO FEEL ALIVE.</span><a href="#workbench">SCROLL TO DISCOVER <span aria-hidden="true">↓</span></a></div>
      </section>

      <section class="roots shell" aria-label="The initial stack">
        <span class="roots-label">GOOD THINGS<br>GROW TOGETHER.</span>
        <span class="root-item"><svg class="vue-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h5l5 9 5-9h5L12 22Z" fill="currentColor"/><path d="M7 4h3l2 3 2-3h3l-5 9Z" fill="#f7f5ec"/></svg>NativeScript <small>Vue first</small></span>
        <span class="root-divider" aria-hidden="true">✧</span>
        <a class="root-item" href="https://jolt.rafaelaugusto.dev/"><span class="jolt-symbol" aria-hidden="true">ϟ</span>Jolt <small>Motion</small><span class="root-arrow" aria-hidden="true">↗</span></a>
        <span class="root-divider" aria-hidden="true">✧</span>
        <a class="root-item" href="https://vue-router-ns.rafaelaugusto.dev/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18V9a4 4 0 0 1 8 0v6a3 3 0 0 0 6 0V4m-4 4 4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>vue-router-ns <small>Navigation</small><span class="root-arrow" aria-hidden="true">↗</span></a>
      </section>

      <section class="workbench shell" id="workbench">
        <div class="section-topline"><span class="eyebrow">I. THE WORKBENCH</span><span class="edition">SMALL DETAILS, BIG FEELINGS</span></div>
        <div class="section-heading"><h2>Something you can <em>feel.</em></h2><p>A press, a spring, a change of mood.<br>Play with a few ideas we're growing.</p></div>
        <div class="studio" :style="previewStyle">
          <aside class="studio-sidebar">
            <div class="studio-label"><svg aria-hidden="true"><use href="#spark"/></svg> A STUDY IN NATIVE UI</div>
            <div class="studio-tabs" role="tablist" aria-label="Explore UI concepts">
              <button v-for="(tab, index) in tabs" :key="tab.id" :id="`tab-${tab.id}`" role="tab" :aria-selected="activeTab === tab.id" :aria-controls="`panel-${tab.id}`" :tabindex="activeTab === tab.id ? 0 : -1" @click="selectTab(tab.id)" @keydown="moveTab($event, index)"><span>{{ tab.number }}</span>{{ tab.label }}<span class="tab-arrow" aria-hidden="true">↗</span></button>
            </div>
            <div class="studio-description" aria-live="polite">
              <template v-if="activeTab === 'components'"><h3>Ordinary moments.<br>Extraordinary care.</h3><p>Buttons, switches, cards, and sheets. Familiar pieces, made to belong together.</p></template>
              <template v-else-if="activeTab === 'motion'"><h3>Nothing moves<br>without a reason.</h3><p>A little anticipation. A gentle landing. Motion that makes an interaction feel complete.</p></template>
              <template v-else><h3>Same roots.<br>Your own character.</h3><p>Forest, dusk, or a little afternoon sun. A design language should leave room for yours.</p></template>
            </div>
            <span class="studio-footnote">DESIGN EXPLORATION · 001</span>
          </aside>
          <div class="studio-canvas" :id="`panel-${activeTab}`" role="tabpanel" :aria-labelledby="`tab-${activeTab}`" tabindex="0">
            <div class="canvas-grid" aria-hidden="true"></div>
            <span class="canvas-label">{{ activeTab === 'components' ? 'A FEW PIECES OF THE PUZZLE' : activeTab === 'motion' ? 'A LITTLE FAIRY DUST' : 'FIND YOUR COLOUR' }}</span>
            <div v-if="activeTab === 'components'" class="component-composition">
              <div class="reading-card">
                <div class="card-art"><img src="/images/mavis-forest.webp" alt="" loading="lazy" width="1536" height="1024"><span class="card-tag">A MOMENT FOR YOU</span><button class="favorite" :aria-pressed="saved" aria-label="Save this moment" @click="saved = !saved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" :fill="saved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5"/></svg></button></div>
                <div class="card-copy"><span class="tiny-label">THE SLOW CHAPTER</span><h3>A quiet kind of magic.</h3><p>Make a little room for the things you love.</p><button class="card-action" @click="sheet.showModal()">Stay a little longer <span aria-hidden="true">↗</span></button></div>
              </div>
              <div class="preference-chip"><span class="moon" aria-hidden="true">☾</span><span>Quiet moments<small>A little less noise.</small></span><button class="switch" role="switch" :aria-checked="quiet" aria-label="Quiet moments" @click="quiet = !quiet"><span></span></button></div>
              <div class="save-note" role="status"><span aria-hidden="true">{{ saved ? '♥' : '✧' }}</span>{{ saved ? 'A little magic, saved.' : 'Good things are worth keeping.' }}</div>
            </div>
            <div v-else-if="activeTab === 'motion'" class="motion-composition">
              <div class="magic-circle" :key="cast" :class="{ casting: cast > 0 }" aria-hidden="true"><div class="ring ring-one"></div><div class="ring ring-two"></div><div class="magic-core"><svg><use href="#mavis-wing"/></svg></div><svg v-for="i in 8" :key="i" class="magic-spark" :style="{ '--i': i }"><use href="#spark"/></svg></div>
              <h3>A gentle kind of energy.</h3><button class="button primary cast-button" @click="cast++"><svg aria-hidden="true"><use href="#spark"/></svg>{{ cast ? 'A little more magic' : 'Make a little magic' }}</button><span class="motion-note" role="status">{{ cast ? 'One small gesture. A little wonder.' : 'Go on. Give it a try.' }}</span>
            </div>
            <div v-else class="palette-composition">
              <div class="palette-card"><div class="palette-art"><svg aria-hidden="true"><use href="#mavis-wing"/></svg><span>{{ currentPalette.name }}<em>A different shade of you.</em></span><div class="palette-orbit" aria-hidden="true"></div></div><div class="palette-card-bottom"><span>Same feeling. Your colours.</span><span aria-hidden="true">✧</span></div></div>
              <div class="palette-options" aria-label="Preview colour palette"><button v-for="(option, key) in palettes" :key="key" :style="{ '--swatch': option.accent }" :aria-pressed="palette === key" @click="palette = key"><span></span>{{ option.name }}</button></div>
            </div>
            <span class="canvas-index">M / 0{{ tabs.findIndex(tab => tab.id === activeTab) + 1 }}</span>
          </div>
        </div>
        <p class="demo-note"><span aria-hidden="true">✧</span> Browser sketches, not shipped components. This is where the ideas begin.</p>
      </section>

      <section class="story shell" id="story">
        <div class="story-art"><div class="story-seal"><svg aria-hidden="true"><use href="#mavis-wing"/></svg><span>MAVIS</span><small>IMAGINATION, MEET CRAFT.</small></div><span class="story-spark spark-one" aria-hidden="true">✧</span><span class="story-spark spark-two" aria-hidden="true">✦</span><span class="story-caption">A SMALL NAME. A WORLD OF POSSIBILITY.</span></div>
        <div class="story-copy"><span class="eyebrow">II. A LITTLE BACKSTORY</span><h2>Every good thing<br>starts with <em>a little belief.</em></h2><p>Mavis takes its name from <a href="https://www.fairytail-tv.com/character/">Mavis Vermillion, from Fairy Tail</a>. A nod to imagination, curiosity, and the things people can build together.</p><p>For us, that means native interfaces with character. Components that fit together. Motion that feels natural. And enough room to make something that's unmistakably yours.</p><span class="story-signature">A little wonder. A lot of care.</span></div>
      </section>

      <section class="journey shell" id="journey">
        <div class="section-topline"><span class="eyebrow">III. PUTTING DOWN ROOTS</span><span class="edition">ONE CHAPTER AT A TIME</span></div>
        <div class="journey-heading"><h2>Starting small.<br><em>Dreaming a little bigger.</em></h2><p>NativeScript is home. Vue is the first chapter.<br>Here's where we'd like the story to go.</p></div>
        <ol class="journey-steps"><li class="current"><span class="step-node"><span></span></span><span class="step-state">FIRST CHAPTER · IN DEVELOPMENT</span><h3>NativeScript + Vue</h3><p>Our first components, with Jolt for motion and vue-router-ns for navigation.</p></li><li><span class="step-node"></span><span class="step-state">THE NEXT CHAPTER</span><h3>More NativeScript</h3><p>The same care, brought to the other frameworks in the NativeScript ecosystem.</p></li><li><span class="step-node"></span><span class="step-state">ROOM TO EXPLORE</span><h3>Beyond the familiar</h3><p>React Native, Flutter, and direct native integrations. Possibilities, not promises.</p></li></ol>
      </section>

      <section class="invitation shell"><div class="invitation-line"><span></span><svg aria-hidden="true"><use href="#mavis-wing"/></svg><span></span></div><span class="eyebrow">THE STORY IS JUST BEGINNING</span><h2>Let's make something<br><em>a little more magical.</em></h2><p>No install command just yet. Just an idea worth building well.</p><a class="button primary" href="https://github.com/getcortexlabs/mavis-ui">Come build with us <span aria-hidden="true">↗</span></a><span class="invitation-note">FOLLOW THE PROJECT ON GITHUB</span></section>
    </main>

    <footer class="site-footer shell"><a href="#" class="brand" aria-label="Back to top"><svg aria-hidden="true"><use href="#mavis-wing"/></svg><span>mavis<span class="ui">ui</span></span></a><span>Made with a little wonder.</span><a href="https://getcortexlabs.com/">A Cortex Labs project <span aria-hidden="true">↗</span></a></footer>

    <dialog class="moment-sheet" ref="sheet" aria-labelledby="sheet-title" @click="event => { if (event.target === sheet) sheet.close() }"><button class="sheet-close" aria-label="Close preview" @click="sheet.close()">×</button><div class="sheet-grip" aria-hidden="true"></div><svg class="sheet-wing" aria-hidden="true"><use href="#mavis-wing"/></svg><span class="eyebrow">A SMALL PAUSE</span><h2 id="sheet-title">Nothing to rush.<br><em>Stay a little.</em></h2><p>A sheet should feel like part of the moment.<br>This is a browser preview of that idea.</p><button class="button primary" @click="sheet.close()">Back to the workbench <span aria-hidden="true">↗</span></button></dialog>
  </div>
</template>

<style src="./style.css" scoped></style>
