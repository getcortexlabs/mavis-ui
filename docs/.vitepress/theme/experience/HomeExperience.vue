<script setup>
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'
import { defineTheme } from '@getcortexlabs/mavis-core'
import { componentCategories } from '../../catalog.mjs'
import StudioBoard from './StudioBoard.vue'
import ThemeStudio from './ThemeStudio.vue'
import PlatformProof from './PlatformProof.vue'
import ShowcaseCollection from './ShowcaseCollection.vue'
import { useCopy } from './copy.js'

const { lang } = useData()
const pt = computed(() => lang.value === 'pt-BR')
const prefix = computed(() => (pt.value ? '/pt-BR' : ''))
const count = componentCategories.reduce((sum, category) => sum + category.items.length, 0)
const root = ref(null)
const rating = ref(4)
const enabled = ref(true)
const volume = ref(65)
const peekTheme = defineTheme({
  name: 'site-peeks',
  colors: { primary: '#A63D2E', primarySoft: '#FBEDE5', text: '#292823' },
  typography: { body: { fontSize: 14 } },
})
const { copy, copied, failed } = useCopy()
const command = 'npx @getcortexlabs/create-mavis@latest'
const motion = useWebMotion(root)
motion.use((scope, element) => {
  scope.viewportEnter([...element.querySelectorAll('[data-reveal]')], {
    keyframes: { y: [26, 0], opacity: [0, 1] },
    transition: { duration: 750, bounce: 0.12 },
    once: true,
    threshold: 0.12,
  })
  scope.animate(
    element.querySelector('.hero-display'),
    { y: [22, 0], opacity: [0, 1] },
    { duration: 850, bounce: 0.08 },
  )
  scope.animate(
    element.querySelector('.hero-character img'),
    { y: [24, 0], opacity: [0, 1] },
    { duration: 1000, bounce: 0.12 },
  )
})
</script>

<template>
  <div ref="root" class="mavis-experience vp-raw">
    <section class="experience-hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <a class="hero-edition" :href="`${prefix}/guide/foundation`"
          ><span class="edition-dot"></span>
          {{ pt ? 'OPEN SOURCE. CHEIO DE POSSIBILIDADES.' : 'OPEN SOURCE. FULL OF POSSIBILITY.' }}
          <span aria-hidden="true">↗</span></a
        >
        <h1 id="hero-title" class="hero-display">
          <span>Interfaces </span><br />{{ pt ? 'com ' : 'with ' }}<br /><em>{{
            pt ? 'personalidade.' : 'character.'
          }}</em
          ><span class="hero-period" aria-hidden="true">✳︎</span>
        </h1>
        <p class="hero-description">
          {{
            pt
              ? 'Componentes que dão vida às suas ideias. Feitos com Vue, em casa no Web, iOS e Android.'
              : 'Thoughtful components that bring your ideas to life. Made with Vue. At home on Web, iOS and Android.'
          }}
        </p>
        <div class="hero-actions">
          <a class="experience-button" :href="`${prefix}/guide/create`"
            >{{ pt ? 'Crie algo seu' : 'Make something yours' }}
            <span aria-hidden="true">↗</span></a
          ><a class="experience-text-link" href="#collection"
            >{{ pt ? 'Explore os componentes' : 'Meet the components' }}
            <span aria-hidden="true">↓</span></a
          >
        </div>
        <div class="hero-footnote">
          <span class="mini-code" aria-hidden="true">&lt;/&gt;</span
          ><span
            >{{ pt ? 'Uma linguagem de componentes.' : 'One component language.' }}<br /><b>{{
              pt ? 'Muitas maneiras de se expressar.' : 'So many ways to express yourself.'
            }}</b></span
          >
        </div>
      </div>
      <figure class="hero-character">
        <div class="character-halo" aria-hidden="true"></div>
        <span class="character-spark" aria-hidden="true">✧</span>
        <img
          src="/images/mavis.webp"
          width="472"
          height="734"
          fetchpriority="high"
          decoding="async"
          :alt="
            pt
              ? 'Mavis Vermillion, de Fairy Tail, a inspiração para o nome do projeto.'
              : 'Mavis Vermillion from Fairy Tail, the inspiration for the project’s name.'
          "
        />
        <figcaption><span>Mavis Vermillion</span><span>Fairy Tail</span></figcaption>
      </figure>
    </section>

    <div class="experience-platform-strip">
      <span>{{ pt ? 'SUA IDEIA TEM LUGAR AQUI.' : 'YOUR IDEA BELONGS HERE.' }}</span>
      <div>
        <span>Vue <small>+ Vite</small></span
        ><i>✳︎</i><span>Nuxt <small>SSR / SSG</small></span
        ><i>✳︎</i><span>NativeScript <small>iOS + Android</small></span>
      </div>
      <a href="https://github.com/getcortexlabs/mavis-ui">MIT <span aria-hidden="true">↗</span></a>
    </div>

    <section class="experience-playground experience-section" aria-labelledby="playground-title">
      <div class="playground-copy" data-reveal>
        <span class="experience-eyebrow">{{ pt ? 'UM POUCO DE MAGIA' : 'A LITTLE MAGIC' }}</span>
        <h2 id="playground-title">
          {{ pt ? 'Mais que aparência.' : 'More than a pretty face.' }}<br /><em>{{
            pt ? 'Sinta a diferença.' : 'Feel the difference.'
          }}</em>
        </h2>
        <p>
          {{
            pt
              ? 'Marque uma tarefa, troque a ordem, ajuste o espaço. Componentes de verdade, com movimento que acompanha cada escolha.'
              : 'Check a task, change the order, make a little room. Real components, with motion that follows every choice.'
          }}
        </p>
        <a class="experience-text-link" href="#studio"
          >{{ pt ? 'Depois, dê o seu toque' : 'Then, make it your own' }}
          <span aria-hidden="true">↓</span></a
        >
      </div>
      <StudioBoard :pt="pt" />
    </section>

    <section
      id="collection"
      class="component-collection experience-section"
      aria-labelledby="collection-title"
    >
      <div class="section-intro" data-reveal>
        <div>
          <span class="experience-eyebrow"
            >01 / {{ pt ? 'OS PEQUENOS GRANDES DETALHES' : 'THE LITTLE BIG DETAILS' }}</span
          >
          <h2 id="collection-title">
            {{ pt ? 'Comece pequeno.' : 'Start small.' }}<br /><em>{{
              pt ? 'Imagine grande.' : 'Think wonderfully big.'
            }}</em>
          </h2>
        </div>
        <div>
          <p>
            {{
              pt
                ? 'Do primeiro botão à interface completa. Peças que compartilham temas, comportamento e atenção aos detalhes.'
                : 'From your first button to the whole experience. Pieces that share themes, behavior and a considered attention to detail.'
            }}
          </p>
          <a class="experience-text-link" :href="`${prefix}/components/`"
            >{{ pt ? `Explore os ${count} componentes` : `Explore all ${count} components` }}
            <span aria-hidden="true">↗</span></a
          ><small>{{
            pt
              ? 'Catálogo de desenvolvimento. Novidades identificadas na documentação.'
              : 'Development catalog. Unreleased additions are marked in the docs.'
          }}</small>
        </div>
      </div>
      <MThemeProvider :theme="peekTheme">
        <div class="component-samples">
          <article class="sample-card sample-rating" data-reveal>
            <div class="sample-stage">
              <span class="sample-spark" aria-hidden="true">✧</span
              ><span class="sample-kicker">{{
                pt ? 'OS DETALHES FICAM.' : 'THE LITTLE THINGS STAY.'
              }}</span>
              <h3>{{ pt ? 'Como foi?' : 'How did it feel?' }}</h3>
              <MRating v-model="rating" :label="pt ? 'Sua avaliação' : 'Your rating'" /><span
                class="sample-status"
                >{{ rating }} / 5</span
              >
            </div>
            <a :href="`${prefix}/components/rating`"
              ><span
                >Rating
                <small>{{
                  pt ? 'Dê voz à experiência.' : 'Give the experience a voice.'
                }}</small></span
              ><span aria-hidden="true">↗</span></a
            >
          </article>
          <article class="sample-card sample-switch" data-reveal>
            <div class="sample-stage">
              <div class="sample-orbit" :class="{ active: enabled }" aria-hidden="true">
                <i></i><i></i><i></i><span>✳︎</span>
              </div>
              <MSwitch
                v-model="enabled"
                :label="pt ? 'Um pouco de magia' : 'A little everyday magic'"
              />
            </div>
            <a :href="`${prefix}/components/switch`"
              ><span
                >Switch
                <small>{{
                  pt ? 'Pequena ação. Nova sensação.' : 'A small action. A new feeling.'
                }}</small></span
              ><span aria-hidden="true">↗</span></a
            >
          </article>
          <article class="sample-card sample-slider" data-reveal>
            <div class="sample-stage">
              <span class="sample-kicker">{{ pt ? 'NO SEU RITMO' : 'ON YOUR WAVELENGTH' }}</span>
              <div class="sample-wave" aria-hidden="true">
                <i
                  v-for="n in 15"
                  :key="n"
                  :style="{ height: `${14 + Math.sin(n * 1.7) ** 2 * volume}px` }"
                ></i>
              </div>
              <MSlider v-model="volume" :label="pt ? 'Intensidade' : 'Intensity'" :step="1" />
            </div>
            <a :href="`${prefix}/components/slider`"
              ><span
                >Slider
                <small>{{ pt ? 'Encontre o ponto certo.' : 'Find your just right.' }}</small></span
              ><span aria-hidden="true">↗</span></a
            >
          </article>
        </div>
      </MThemeProvider>
      <div class="collection-index">
        <span>{{ pt ? 'FEITOS PARA FUNCIONAR JUNTOS' : 'MADE TO BELONG TOGETHER' }}</span
        ><a
          v-for="category in componentCategories.slice(0, 7)"
          :key="category.name[0]"
          :href="`${prefix}/components/#${category.name[0].toLowerCase().replace(/[^a-z]+/g, '-')}`"
          >{{ category.name[pt ? 1 : 0] }} <sup>{{ category.items.length }}</sup></a
        >
      </div>
    </section>

    <ThemeStudio :pt="pt" />
    <PlatformProof :pt="pt" />

    <section class="experience-showcase experience-section" aria-labelledby="showcase-title">
      <div class="section-intro" data-reveal>
        <div>
          <span class="experience-eyebrow"
            >04 / {{ pt ? 'IDEIAS QUE GANHAM VIDA' : 'IDEAS, OUT IN THE WORLD' }}</span
          >
          <h2 id="showcase-title">
            {{ pt ? 'As peças se encontram.' : 'The pieces come together.' }}<br /><em>{{
              pt ? 'Algo seu acontece.' : 'Something yours happens.'
            }}</em>
          </h2>
        </div>
        <div>
          <p>
            {{
              pt
                ? 'Explore composições completas. Encontre uma ideia, abra a demonstração e veja como ela foi feita.'
                : 'Explore complete compositions. Find a little inspiration, open the demo and see how it was made.'
            }}
          </p>
          <a class="experience-text-link" :href="`${prefix}/showcase/`"
            >{{ pt ? 'Entre no showcase' : 'Step into the showcase' }}
            <span aria-hidden="true">↗</span></a
          >
        </div>
      </div>
      <ShowcaseCollection featured />
    </section>

    <section class="motion-note experience-section" aria-labelledby="motion-note-title" data-reveal>
      <span class="motion-flower" aria-hidden="true">✳︎</span>
      <div>
        <span class="experience-eyebrow">{{
          pt ? 'MOVIMENTO COM INTENÇÃO' : 'MOTION WITH INTENTION'
        }}</span>
        <h2 id="motion-note-title">
          {{ pt ? 'Você sente a diferença.' : 'You can feel the difference.' }}
        </h2>
        <p>
          {{
            pt
              ? 'Feedback ao tocar. Layout que acompanha suas escolhas. Transições que mantêm o contexto. O Jolt dá movimento aos componentes Mavis — respeitando sua preferência por movimento reduzido.'
              : 'Feedback when you touch. Layouts that follow your choices. Transitions that keep you in the moment. Jolt brings motion to Mavis components — respecting your reduced-motion preference.'
          }}
        </p>
      </div>
      <a class="experience-text-link" :href="`${prefix}/guide/motion`"
        >{{ pt ? 'Conheça o movimento' : 'Explore the motion' }} ↗</a
      >
    </section>

    <section class="experience-finale" aria-labelledby="start-title">
      <span class="experience-eyebrow">{{
        pt ? 'SUA PRÓXIMA IDEIA COMEÇA AQUI' : 'YOUR NEXT IDEA STARTS HERE'
      }}</span>
      <h2 id="start-title">
        {{ pt ? 'Faça algo' : 'Make something' }}<br /><em>{{
          pt ? 'que seja seu.' : 'that feels like you.'
        }}</em>
      </h2>
      <div class="install-command">
        <code>{{ command }}</code
        ><button
          type="button"
          @click="copy(command)"
          :aria-label="pt ? 'Copiar comando de instalação' : 'Copy installation command'"
        >
          {{ copied ? '✓' : '↗' }}
        </button>
      </div>
      <p role="status">
        {{
          failed
            ? pt
              ? 'Selecione o comando acima para copiar.'
              : 'Select the command above to copy it.'
            : copied
              ? pt
                ? 'Copiado. Sua próxima ideia espera por você.'
                : 'Copied. Your next idea is waiting.'
              : pt
                ? 'Vue + Vite, Nuxt ou NativeScript. A CLI prepara o começo.'
                : 'Vue + Vite, Nuxt or NativeScript. The CLI gets you started.'
        }}
      </p>
      <a class="experience-text-link" :href="`${prefix}/guide/foundation`"
        >{{ pt ? 'Leia o guia de instalação' : 'Read the setup guide' }}
        <span aria-hidden="true">↗</span></a
      >
      <div class="finale-wordmark" aria-hidden="true">mavis<span>✳︎</span></div>
    </section>
  </div>
</template>
