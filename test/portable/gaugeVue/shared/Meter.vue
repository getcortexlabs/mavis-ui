<script setup lang="ts">
import { ref } from 'vue'

const load = ref(75)

function set(next: number) {
  load.value = next
}
</script>

<template>
  <MColumn id="page" gap="lg">
    <MRow gap="md" align="start">
      <MBox id="dial" :width="200" :height="360" background-color="#FFF4D6">
        <MColumn>
          <MGauge label="Load" :value="load" :size="200" :stroke-width="18" suffix="%" />
        </MColumn>
      </MBox>
      <MBox id="tinted" :width="200" :height="360" background-color="#FFF4D6">
        <MColumn>
          <m-gauge
            label="Shifted"
            :value="load"
            :min="50"
            :max="150"
            :size="200"
            :stroke-width="18"
            color="#2F7D6B"
            :animated="false"
            :format-value="(value) => `${value} rpm`"
          />
        </MColumn>
      </MBox>
    </MRow>
    <MText>Load {{ load }}</MText>
    <MRow gap="sm" wrap>
      <MButton text="Low" @click="set(25)" />
      <MButton text="High" variant="secondary" @click="set(75)" />
      <MButton text="Over" variant="secondary" @click="set(140)" />
    </MRow>
    <MRow id="pair" gap="md" align="start">
      <MGauge id="whole" label="Whole" :value="load" :size="120" animate-number />
      <MColumn id="stack">
        <MBox id="spacer" :height="50.4" />
        <MGauge id="half" label="Half" :value="load" :size="120" semi />
      </MColumn>
    </MRow>
  </MColumn>
</template>
