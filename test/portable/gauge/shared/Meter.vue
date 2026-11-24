<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  load: 75 as number,
  set(next: number): void {
    state.load = next
  },
})
</script>

<template>
  <MColumn id="page" gap="lg">
    <MRow gap="md" align="start">
      <MBox id="dial" :width="200" :height="360" backgroundColor="#FFF4D6">
        <MColumn>
          <MGauge label="Load" :value="state.load" :size="200" :strokeWidth="18" suffix="%" />
        </MColumn>
      </MBox>
      <MBox id="tinted" :width="200" :height="360" backgroundColor="#FFF4D6">
        <MColumn>
          <MGauge
            label="Shifted"
            :value="state.load"
            :min="50"
            :max="150"
            :size="200"
            :strokeWidth="18"
            color="#2F7D6B"
            :animated="false"
            :formatValue="(value) => `${value} rpm`"
          />
        </MColumn>
      </MBox>
    </MRow>
    <MText>{{ `Load ${state.load}` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton text="Low" @click="() => state.set(25)" />
      <MButton text="High" variant="secondary" @click="() => state.set(75)" />
      <MButton text="Over" variant="secondary" @click="() => state.set(140)" />
    </MRow>
    <MRow id="pair" gap="md" align="start">
      <MGauge id="whole" label="Whole" :value="state.load" :size="120" :animateNumber="true" />
      <MColumn id="stack">
        <MBox id="spacer" :height="50.4" />
        <MGauge id="half" label="Half" :value="state.load" :size="120" :semi="true" />
      </MColumn>
    </MRow>
  </MColumn>
</template>
