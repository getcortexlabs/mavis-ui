<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  picture: '' as string,
  person: 'Mavis Vermillion' as string,
  size: 'md' as string,
  shape: 'circle' as string,
  change(): void {
    state.person = 'Makarov Dreyar'
    state.size = 'xl'
    state.shape = 'square'
  },
})
</script>

<template>
  <MColumn gap="md">
    <MRow id="sizes" gap="md" align="end">
      <MAvatar id="size-sm" name="Ada Lovelace" size="sm" />
      <MAvatar id="size-md" name="Grace Hopper" />
      <MAvatar id="size-lg" name="Linus" size="lg" />
      <MAvatar id="size-xl" size="xl" accessibilityLabel="Someone new" />
      <MAvatar id="size-changes" :name="state.person" :size="state.size" :shape="state.shape" />
    </MRow>
    <MColumn id="frame" :width="220" padding="md" backgroundColor="#102030">
      <MBox>
        <MColumn>
          <MAvatar id="round" :src="state.picture" :name="state.person" size="lg" />
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
      <MText tone="onPrimary">{{ state.person }}</MText>
    </MColumn>
    <MRow gap="sm" :wrap="true">
      <MButton text="Show picture" @click="() => (state.picture = '~/assets/avatar-teal.png')" />
      <MButton text="Change" @click="() => state.change()" />
    </MRow>
  </MColumn>
</template>
