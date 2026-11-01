<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog()
const { theme } = useMavisTheme()
const members = [
  {
    id: 'marina',
    name: 'Marina Costa',
    role: 'Design',
    city: 'São Paulo',
    available: true,
    note: 'Dá forma às ideias e cuida dos pequenos detalhes.',
  },
  {
    id: 'lucas',
    name: 'Lucas Mendes',
    role: 'Engenharia',
    city: 'Lisboa',
    available: false,
    note: 'Transforma boas ideias em experiências que funcionam.',
  },
  {
    id: 'joana',
    name: 'Joana Alves',
    role: 'Produto',
    city: 'Curitiba',
    available: true,
    note: 'Conecta pessoas, necessidades e próximos passos.',
  },
  {
    id: 'noah',
    name: 'Noah Kim',
    role: 'Motion',
    city: 'Seul',
    available: true,
    note: 'Encontra o ritmo certo para cada interação.',
  },
]
type Member = (typeof members)[number]
const section = ref<string | number | null>('all')
const favorites = ref<string[]>([])
const selected = ref<Member>()
const open = ref(false)
const visible = computed(() =>
  members.filter((member) => section.value !== 'available' || member.available),
)
const isFavorite = computed(() => selected.value && favorites.value.includes(selected.value.id))
function showMember(member: Member) {
  selected.value = member
  open.value = true
}
function toggleFavorite() {
  const id = selected.value?.id
  if (!id) return
  favorites.value = favorites.value.includes(id)
    ? favorites.value.filter((value) => value !== id)
    : [...favorites.value, id]
}
function memberLabel(member: Member) {
  return `${member.name}, ${member.role}, ${member.available ? 'disponível' : 'em foco'}${favorites.value.includes(member.id) ? ', favorito' : ''}`
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg" class="showcase-container">
      <m-row justify="between" gap="sm"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        ><ThemeSwitch
      /></m-row>
      <m-column gap="sm"
        ><m-text variant="overline" tone="primary">GENTE QUE FAZ ACONTECER</m-text
        ><m-text as="h1" variant="title">Juntos, vamos mais longe.</m-text
        ><m-text tone="muted">Quatro perspectivas. Uma vontade de criar.</m-text></m-column
      >
      <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.accentSoft">
        <m-row justify="between" gap="md"
          ><m-avatar
            name="Mavis Studio"
            shape="square"
            size="lg"
            :accessibilityHidden="true" /><m-badge
            text="Estúdio independente"
            tone="accent"
            size="sm"
        /></m-row>
        <m-column gap="xs"
          ><m-text variant="title">Mavis Studio</m-text
          ><m-text tone="accent">Boas pessoas. Grandes ideias.</m-text></m-column
        >
        <m-separator />
        <m-row gap="sm">
          <m-column :width="0" :grow="1" gap="xs"
            ><m-text variant="heading">4</m-text
            ><m-text variant="caption" tone="muted">Pessoas na equipe</m-text></m-column
          >
          <m-separator orientation="vertical" spacing="sm" :length="36" />
          <m-column :width="0" :grow="1" gap="xs"
            ><m-text variant="heading">{{ favorites.length }}</m-text
            ><m-text variant="caption" tone="muted">Contatos favoritos</m-text></m-column
          >
        </m-row>
      </m-column>
      <m-tabs
        v-model="section"
        label="Pessoas da equipe"
        :tabs="[
          { value: 'all', label: 'Todas (4)' },
          { value: 'available', label: 'Disponíveis (3)' },
        ]"
      >
        <template #default>
          <m-card :padding="0">
            <template v-for="(member, index) in visible" :key="member.id">
              <m-separator v-if="index" inset="md" />
              <m-list-item
                :title="member.name"
                :description="`${member.role} · ${member.city}`"
                interactive
                :accessibilityLabel="memberLabel(member)"
                @click="showMember(member)"
              >
                <template #leading
                  ><m-avatar :name="member.name" :accessibilityHidden="true"
                /></template>
                <template #trailing
                  ><m-badge
                    :text="
                      favorites.includes(member.id)
                        ? 'Favorito'
                        : member.available
                          ? 'Disponível'
                          : 'Em foco'
                    "
                    :tone="
                      favorites.includes(member.id)
                        ? 'primary'
                        : member.available
                          ? 'success'
                          : 'neutral'
                    "
                    size="sm"
                /></template>
              </m-list-item>
            </template>
          </m-card>
        </template>
      </m-tabs>
      <m-text variant="caption" tone="muted"
        >Pessoas fictícias, conexões possíveis. Os favoritos ficam só nesta demonstração.</m-text
      >
    </m-column>
    <m-sheet v-model:open="open" :title="selected?.name || 'Pessoa da equipe'" closeLabel="Fechar">
      <m-column v-if="selected" gap="lg">
        <m-row gap="md"
          ><m-avatar :name="selected.name" size="lg" :accessibilityHidden="true" /><m-column
            :width="0"
            :grow="1"
            gap="xs"
            ><m-text variant="heading">{{ selected.role }}</m-text
            ><m-text tone="muted">{{ selected.city }}</m-text></m-column
          ><m-badge
            :text="selected.available ? 'Disponível' : 'Em foco'"
            :tone="selected.available ? 'success' : 'neutral'"
            size="sm"
        /></m-row>
        <m-separator />
        <m-text>{{ selected.note }}</m-text>
        <m-button :icon="isFavorite ? 'check' : 'bookmark'" @click="toggleFavorite">{{
          isFavorite ? 'Remover favorito' : 'Favoritar contato'
        }}</m-button>
        <m-text variant="caption" tone="muted">{{
          isFavorite
            ? 'Contato salvo nos favoritos desta sessão.'
            : 'Guarde por perto quem inspira você.'
        }}</m-text>
      </m-column>
    </m-sheet>
  </m-screen>
</template>
