<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  position: 50 as number,
  upright: false as boolean,
})
</script>

<template>
  <MColumn gap="md" :width="360">
    <MBox id="compare">
      <MImageCompare
        label="Photo comparison"
        before="~/assets/compare-before.png"
        after="~/assets/compare-after.png"
        beforeLabel="Original"
        afterLabel="Edited"
        :modelValue="state.position"
        @update:modelValue="(value) => (state.position = value)"
        :step="5"
        :aspectRatio="2"
        :orientation="state.upright ? 'vertical' : 'horizontal'"
      />
      <MColumn :paddingX="80" :paddingY="70">
        <MRow justify="between">
          <MColumn id="near" :width="6" :height="6" />
          <MColumn id="far" :width="6" :height="6" />
        </MRow>
      </MColumn>
    </MBox>
    <MText>{{ `Showing ${state.position}% of the original` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton text="All" @click="() => (state.position = 100)" />
      <MButton text="None" @click="() => (state.position = 0)" />
      <MButton text="Half" @click="() => (state.position = 50)" />
      <MButton text="Turn" @click="() => (state.upright = !state.upright)" />
    </MRow>
  </MColumn>
</template>
