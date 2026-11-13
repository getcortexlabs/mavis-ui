<script setup lang="ts">
import { ref } from 'vue'
import { MAvatar, MBox, MButton, MColumn, MRow, MText } from '#mavis'

const picture = ref('')
const person = ref('Mavis Vermillion')
const size = ref<'md' | 'xl'>('md')
const shape = ref<'circle' | 'square'>('circle')

function change() {
  person.value = 'Makarov Dreyar'
  size.value = 'xl'
  shape.value = 'square'
}
</script>

<template>
  <MColumn gap="md">
    <MRow id="sizes" gap="md" align="end">
      <MAvatar id="size-sm" name="Ada Lovelace" size="sm" />
      <m-avatar id="size-md" name="Grace Hopper" />
      <MAvatar id="size-lg" name="Linus" size="lg" />
      <MAvatar id="size-xl" size="xl" accessibilityLabel="Someone new" />
      <MAvatar id="size-changes" :name="person" :size="size" :shape="shape" />
    </MRow>
    <MColumn id="frame" :width="220" padding="md" backgroundColor="#102030">
      <MBox>
        <MColumn>
          <MAvatar id="round" :src="picture" :name="person" size="lg" />
        </MColumn>
        <MColumn :padding="6">
          <MColumn id="round-corner" :width="4" :height="4" />
        </MColumn>
      </MBox>
      <MBox>
        <MColumn>
          <MAvatar id="square" name="Zé" size="lg" shape="square" />
        </MColumn>
        <MColumn :padding="6">
          <MColumn id="square-corner" :width="4" :height="4" />
        </MColumn>
      </MBox>
      <MText tone="onPrimary">{{ person }}</MText>
    </MColumn>
    <MRow gap="sm" wrap>
      <MButton text="Show picture" @click="picture = '~/assets/avatar-teal.png'" />
      <MButton text="Change" @click="change" />
    </MRow>
  </MColumn>
</template>
