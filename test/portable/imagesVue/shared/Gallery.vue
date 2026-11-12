<script setup lang="ts">
import { ref } from 'vue'
import { MBox, MButton, MColumn, MImage, MRow, MText } from '#mavis'

const picture = ref('~/assets/gallery-blue.png')
const loaded = ref('nothing yet')
const broken = ref('')
const failed = ref('nothing yet')
</script>

<template>
  <MColumn gap="md" :width="240">
    <MImage id="photo" :src="picture" alt="A swatch of color" @load="(src) => (loaded = src)" />
    <MText>Loaded {{ loaded }}</MText>
    <MBox>
      <m-image
        id="contained"
        src="~/assets/gallery-wide.png"
        alt="Twice as wide as tall, all of it showing"
        :aspect-ratio="1"
        fit="contain"
        radius="none"
        background-color="#F4E9FF"
      />
      <MColumn align="center">
        <MColumn id="contained-top" :width="8" :height="8" />
      </MColumn>
    </MBox>
    <MBox>
      <MImage
        id="covered"
        src="~/assets/gallery-wide.png"
        alt="Twice as wide as tall, filling a square"
        :aspectRatio="1"
        radius="none"
      />
      <MColumn align="center">
        <MColumn id="covered-top" :width="8" :height="8" />
      </MColumn>
    </MBox>
    <MColumn id="frame" backgroundColor="#102030">
      <MBox>
        <MImage id="rounded" src="~/assets/gallery-blue.png" alt="" :aspectRatio="2" :radius="40" />
        <MColumn align="start">
          <MColumn id="rounded-corner" :width="6" :height="6" />
        </MColumn>
      </MBox>
    </MColumn>
    <MImage
      id="fixed"
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC"
      alt="From a data URI"
      :width="120"
      :height="90"
      :aspectRatio="3"
      radius="none"
    />
    <MImage
      id="missing"
      :src="broken"
      alt="A picture that does not load"
      :aspectRatio="2"
      loadingLabel="Loading the picture"
      errorLabel="No picture"
      @error="(src) => (failed = src)"
    />
    <MText>Failed {{ failed }}</MText>
    <MRow gap="sm" wrap>
      <MButton text="Next picture" @click="picture = '~/assets/gallery-green.png'" />
      <MButton text="Break" @click="broken = 'data:image/png;base64,broken'" />
    </MRow>
  </MColumn>
</template>
