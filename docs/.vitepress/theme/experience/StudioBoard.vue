<script setup>
import { computed, ref } from 'vue'
import { defineTheme } from '@getcortexlabs/mavis-core'
import { useWebMotion } from '@rafaelaugusto/jolt/web/vue'

const props = defineProps({ pt: Boolean })
const root = ref(null)
const list = ref(null)
const compact = ref(false)
const tasks = ref([
  { id: 'idea', en: 'Make something unexpected', pt: 'Crie algo inesperado', done: true },
  { id: 'details', en: 'Give the details some love', pt: 'Cuide de cada detalhe', done: false },
  { id: 'ship', en: 'Put it out into the world', pt: 'Leve sua ideia para o mundo', done: false },
])
const completed = computed(() => tasks.value.filter((task) => task.done).length)
const theme = defineTheme({
  name: 'paper-studio',
  colors: {
    primary: '#A63D2E',
    primarySoft: '#FBEDE5',
    text: '#292823',
    muted: '#69665D',
    border: '#E8E4DB',
  },
  typography: { body: { fontSize: 14 }, caption: { fontSize: 12 } },
})
const motion = useWebMotion(root)
const layout = useWebMotion(list)
let scope
motion.use((current, element) => {
  current.animate(
    [...element.querySelectorAll('[data-board-piece]')],
    { y: [24, 0], opacity: [0, 1] },
    { type: 'spring', duration: 900, bounce: 0.18, stagger: 75 },
  )
  const pointer = current.pointerFollow(element, { range: { x: [-7, 7], y: [-5, 5] } })
  current.bind(element.querySelector('.board-orbit'), { x: pointer.x, y: pointer.y })
  scope = current
  return () => {
    scope = undefined
  }
})
function shuffle() {
  layout.animateLayout(
    () => {
      tasks.value = [...tasks.value.slice(1), tasks.value[0]]
    },
    { duration: 650, bounce: 0.2, size: false },
  )
}
let rotation = 0
function celebrate() {
  const flower = root.value?.querySelector('.board-flower')
  rotation += 180
  if (scope && flower)
    scope.animate(flower, { rotate: rotation }, { duration: 1000, type: 'spring', bounce: 0.2 })
}
</script>

<template>
  <MThemeProvider :theme="theme">
    <div
      ref="root"
      class="studio-board"
      :aria-label="pt ? 'Experimente os componentes Mavis' : 'Try the Mavis components'"
    >
      <div class="board-grid" aria-hidden="true"></div>
      <div class="board-orbit" aria-hidden="true">
        <div class="board-flower">
          <i v-for="n in 8" :key="n" :style="{ rotate: `${n * 45}deg` }"></i><span></span>
        </div>
      </div>
      <div class="board-note" data-board-piece>
        <span class="note-dot"></span
        ><span>{{ pt ? 'Sua próxima grande ideia' : 'Your next good idea' }}</span
        ><span aria-hidden="true">↗</span>
      </div>
      <div class="board-main" data-board-piece>
        <div class="board-topline">
          <span><span class="tiny-spark" aria-hidden="true">✳︎</span> Sunday studio</span
          ><span class="board-edition">NO. 001</span>
        </div>
        <div class="board-heading">
          <span class="experience-eyebrow">{{
            pt ? 'UM POUCO DE INTENÇÃO' : 'A LITTLE INTENTION'
          }}</span>
          <h2>
            {{ pt ? 'Abra espaço' : 'Make room' }}<br /><em>{{
              pt ? 'para o que importa.' : 'for the good stuff.'
            }}</em>
          </h2>
        </div>
        <div class="board-list-label">
          <span>{{ pt ? 'Hoje, no seu ritmo' : 'Today, at your own pace' }}</span
          ><button
            type="button"
            @click="shuffle"
            :aria-label="pt ? 'Reordenar tarefas' : 'Reorder tasks'"
          >
            ⇅ <span>{{ pt ? 'Reordenar' : 'Shuffle' }}</span>
          </button>
        </div>
        <div ref="list" class="board-tasks" :class="{ compact }">
          <div v-for="task in tasks" :key="task.id" class="board-task">
            <MCheckbox
              v-model="task.done"
              :label="pt ? task.pt : task.en"
              @update:model-value="celebrate"
            />
          </div>
        </div>
        <div class="board-progress-label">
          <span>{{ pt ? 'Pequenos passos. Boas coisas.' : 'Small steps. Good things.' }}</span
          ><span>{{ completed }}/3</span>
        </div>
        <MProgress
          :value="completed"
          :max="3"
          :label="pt ? 'Tarefas concluídas' : 'Completed tasks'"
        />
        <div class="board-bottom">
          <div class="board-avatars" aria-label="Sunday studio">
            <span>AL</span><span>JO</span><span>+2</span>
          </div>
          <span>{{ pt ? 'Melhor juntos.' : 'Better together.' }}</span
          ><span aria-hidden="true">✧</span>
        </div>
      </div>
      <div class="board-settings" data-board-piece>
        <MSwitch v-model="compact" :label="pt ? 'Modo compacto' : 'Keep it compact'" /><span>{{
          pt ? 'Um pequeno ajuste. Outra sensação.' : 'One small change. A different feeling.'
        }}</span>
      </div>
      <div class="board-sticker" aria-hidden="true">
        <span>MADE<br />WITH<br /><b>mavis.</b></span
        ><i>↗</i>
      </div>
      <p class="board-caption">
        <span aria-hidden="true">↖</span>
        {{ pt ? 'De verdade. Pode mexer.' : 'Real components. Go on, play.' }}
      </p>
    </div>
  </MThemeProvider>
</template>
