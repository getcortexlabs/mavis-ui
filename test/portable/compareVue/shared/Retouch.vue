<script setup lang="ts">
import { ref } from 'vue'
import { MBox, MButton, MColumn, MImageCompare, MRow, MText } from '#mavis'

const position = ref(50)
const upright = ref(false)
</script>

<template>
  <MColumn gap="md" :width="360">
    <MBox id="compare">
      <MImageCompare
        v-model="position"
        label="Photo comparison"
        before="~/assets/compare-before.png"
        after="~/assets/compare-after.png"
        beforeLabel="Original"
        afterLabel="Edited"
        :step="5"
        :aspectRatio="2"
        :orientation="upright ? 'vertical' : 'horizontal'"
      />
      <MColumn :paddingX="80" :paddingY="70">
        <MRow justify="between">
          <MColumn id="near" :width="6" :height="6" />
          <MColumn id="far" :width="6" :height="6" />
        </MRow>
      </MColumn>
    </MBox>
    <MText>Showing {{ position }}% of the original</MText>
    <MRow gap="sm" wrap>
      <MButton text="All" @click="position = 100" />
      <MButton text="None" @click="position = 0" />
      <MButton text="Half" @click="position = 50" />
      <MButton text="Turn" @click="upright = !upright" />
    </MRow>
  </MColumn>
</template>
