<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ pt: Boolean })
const platform = ref('web')
const prefix = computed(() => (props.pt ? '/pt-BR' : ''))
const platforms = ['web', 'ios', 'android']
const labels = { web: 'Web', ios: 'iOS', android: 'Android' }
const source = `<m-screen :motionScroll="source">\n  <m-column padding="lg" gap="lg">\n    <m-card :motionSurface="surface">\n      <m-text variant="title">\n        Find your own way.\n      </m-text>\n      <m-text>{{ detail }}</m-text>\n    </m-card>\n  </m-column>\n</m-screen>`
</script>

<template>
  <section class="platform-proof experience-section" aria-labelledby="platform-title">
    <div class="platform-copy" data-reveal>
      <span class="experience-eyebrow"
        >03 / {{ pt ? 'MAIS LUGARES. A MESMA IDEIA.' : 'MORE PLACES. THE SAME IDEA.' }}</span
      >
      <h2 id="platform-title">
        {{ pt ? 'Uma tela Vue.' : 'One Vue screen.' }}<br /><em>{{
          pt ? 'Um mundo de possibilidades.' : 'A world of possibility.'
        }}</em>
      </h2>
      <p>
        {{
          pt
            ? 'Leve seus componentes, estado e identidade para o navegador e para views nativas. Cada plataforma tem seu renderer. Sua tela continua compartilhada.'
            : 'Bring your components, state and identity to the browser and to native views. Each platform has its own renderer. Your screen stays shared.'
        }}
      </p>
      <div class="platform-code">
        <div>
          <i></i><i></i><i></i
          ><span
            >FieldGuide.vue <small>{{ pt ? 'trecho' : 'excerpt' }}</small></span
          >
        </div>
        <pre
          tabindex="0"
          :aria-label="pt ? 'Trecho da tela compartilhada' : 'Shared screen excerpt'"
        ><code>{{ source }}</code></pre>
      </div>
      <a class="experience-text-link" :href="`${prefix}/guide/sharing`"
        >{{ pt ? 'Entenda o compartilhamento' : 'Explore code sharing' }}
        <span aria-hidden="true">↗</span></a
      >
    </div>
    <div class="platform-viewer" data-reveal>
      <div
        class="platform-selector"
        role="group"
        :aria-label="pt ? 'Plataforma da demonstração' : 'Demo platform'"
      >
        <button
          v-for="item in platforms"
          :key="item"
          type="button"
          :aria-pressed="platform === item"
          @click="platform = item"
        >
          {{ labels[item]
          }}<small>{{
            item === 'web'
              ? pt
                ? 'Interativo'
                : 'Interactive'
              : pt
                ? 'Gravação real'
                : 'Real recording'
          }}</small>
        </button>
      </div>
      <div class="platform-device">
        <div class="platform-device-bar">
          <span>Field Guide</span><span aria-hidden="true">● ● ●</span>
        </div>
        <iframe
          v-if="platform === 'web'"
          :src="`/playground/#/showcase/field-guide?lang=${pt ? 'pt' : 'en'}`"
          loading="lazy"
          :title="
            pt ? 'Field Guide — exemplo Web interativo' : 'Field Guide — interactive Web example'
          "
        ></iframe>
        <video
          v-else
          :key="platform"
          :src="`/media/field-${platform}.mp4`"
          :poster="`/images/field-${platform}-poster.jpg`"
          controls
          playsinline
          preload="none"
          :aria-label="`Field Guide — ${labels[platform]}`"
        ></video>
      </div>
      <p class="platform-evidence">
        {{
          platform === 'web'
            ? pt
              ? 'Vue Web · experimente rolar e mudar a forma.'
              : 'Vue Web · try scrolling and changing the shape.'
            : platform === 'ios'
              ? 'NativeScript · iPhone 17 Pro · iOS 26.2 Simulator'
              : 'NativeScript · Pixel 7 · Android 16 / API 36 Emulator'
        }}
      </p>
      <a :href="`${prefix}/showcase/field-guide`">{{
        pt ? 'Ver o exemplo e o código completo ↗' : 'See the example and complete source ↗'
      }}</a>
    </div>
  </section>
</template>
