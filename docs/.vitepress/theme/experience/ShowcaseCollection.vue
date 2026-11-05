<script setup>
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'

const props = defineProps({ featured: Boolean })
const { lang } = useData()
const pt = computed(() => lang.value === 'pt-BR')
const prefix = computed(() => (pt.value ? '/pt-BR' : ''))
const scenes = [
  {
    id: 'morrow',
    title: 'Morrow',
    tag: ['A WARM WELCOME', 'UMA BOA CHEGADA'],
    description: [
      'The first hello, made personal. Forms, feedback and a little rhythm.',
      'Um primeiro encontro com personalidade. Formulários, feedback e ritmo.',
    ],
    type: 'auth',
    color: 'lavender',
  },
  {
    id: 'vehicle',
    title: 'Current affairs.',
    name: 'Vehicle controls',
    tag: ['IN YOUR ELEMENT', 'NO SEU ELEMENTO'],
    description: [
      'Range, climate and connected controls. A dashboard with a human side.',
      'Autonomia, clima e controles conectados. Um painel com um lado humano.',
    ],
    type: 'vehicle',
    color: 'mint',
  },
  {
    id: 'afterglow',
    title: 'Afterglow',
    tag: ['ROOM TO EXPLORE', 'ESPAÇO PARA EXPLORAR'],
    description: [
      'Cards, shared layout and small interactions that stay with you.',
      'Cards, layout compartilhado e pequenos detalhes que ficam.',
    ],
    type: 'cards',
    color: 'peach',
  },
  {
    id: 'field-guide',
    title: 'Field Guide',
    tag: ['TAKE THE SCENIC ROUTE', 'APROVEITE O CAMINHO'],
    description: [
      'A reading experience that moves with the story.',
      'Uma experiência de leitura que acompanha a história.',
    ],
    type: 'field',
    color: 'sage',
  },
  {
    id: 'focus',
    title: 'A little headspace.',
    name: 'Focus session',
    tag: ['FIND YOUR FOCUS', 'ENCONTRE SEU FOCO'],
    description: [
      'Set the mood. Make some time. Give one thing your attention.',
      'Escolha o clima. Reserve um tempo. Dê atenção a uma coisa.',
    ],
    type: 'focus',
    color: 'sand',
  },
  {
    id: 'team',
    title: 'Good company.',
    name: 'Team',
    tag: ['BETTER TOGETHER', 'MELHOR JUNTOS'],
    description: [
      'People, availability and the details behind a friendly face.',
      'Pessoas, disponibilidade e os detalhes por trás de um rosto.',
    ],
    type: 'team',
    color: 'blue',
  },
]
const items = computed(() => (props.featured ? scenes.slice(0, 3) : scenes))
const root = ref(null)
const motion = useWebMotion(root)
motion.use((scope, element) =>
  scope.viewportEnter([...element.querySelectorAll('.showcase-tile')], {
    keyframes: { y: [22, 0], opacity: [0, 1] },
    transition: { duration: 650, bounce: 0.1 },
    once: true,
  }),
)
</script>

<template>
  <div ref="root" class="showcase-collection vp-raw">
    <a
      v-for="scene in items"
      :key="scene.id"
      :href="`${prefix}/showcase/${scene.id}`"
      class="showcase-tile"
      :class="`scene-${scene.color}`"
    >
      <div class="showcase-art" :class="`art-${scene.type}`" aria-hidden="true">
        <template v-if="scene.type === 'auth'"
          ><div class="scene-wordmark">morrow<span>✳︎</span></div>
          <div class="scene-form">
            <span>Make yourself at home.</span><i></i><i></i><b>Come on in ↗</b>
          </div>
          <span class="scene-orb"></span
        ></template>
        <template v-else-if="scene.type === 'vehicle'"
          ><div class="scene-dashboard">
            <span>GOOD TO GO</span><strong>284<small>km</small></strong>
            <div class="dashboard-arc"></div>
            <div class="dashboard-settings"><span>21°</span><i>✳︎</i><span>82%</span></div>
          </div></template
        >
        <template v-else-if="scene.type === 'cards'"
          ><div v-for="n in 3" :key="n" class="scene-stack-card" :style="{ '--card': n }">
            <span>0{{ n }}</span
            ><i>✳︎</i
            ><b
              >{{ ['Find a little', 'Make a little', 'Feel a little'][n - 1]
              }}<em>{{ ['wonder.', 'space.', 'more.'][n - 1] }}</em></b
            >
          </div></template
        >
        <template v-else-if="scene.type === 'field'"
          ><div class="scene-field">
            <small>THE OPEN ROAD / 001</small><strong>Find your<br /><em>own way.</em></strong
            ><span>↗</span>
          </div></template
        >
        <template v-else-if="scene.type === 'focus'"
          ><div class="scene-clock">
            <span>25:00</span><small>ONE THING AT A TIME</small>
          </div></template
        >
        <template v-else
          ><div class="scene-people"><span>AL</span><span>JO</span><span>MA</span></div>
          <div class="scene-team-note">
            Good things happen<br /><em>in good company.</em>
          </div></template
        >
      </div>
      <div class="showcase-tile-copy">
        <span class="experience-eyebrow">{{ scene.tag[pt ? 1 : 0] }}</span>
        <h3>{{ scene.title }}<span aria-hidden="true">↗</span></h3>
        <p>{{ scene.description[pt ? 1 : 0] }}</p>
        <span class="scene-platforms">VUE WEB <i>·</i> NATIVESCRIPT</span>
      </div>
    </a>
  </div>
</template>
