<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  backs: 0 as number,
})
</script>

<template>
  <MColumn gap="md">
    <MCollapsibleHeader
      id="trip"
      title="Above the everyday"
      subtitle="A slower kind of escape"
      :height="360"
      :expandedHeight="200"
      :collapsedHeight="56"
      :sectionHeight="40"
      :parallax="0.5"
      :back="true"
      backLabel="Back"
      topLabel="Back to top"
      @back="() => (state.backs += 1)"
    >
      <template #artwork>
        <MColumn id="trip-art" backgroundColor="#C8B6FF" />
      </template>
      <template #actions>
        <MBox id="trip-bar" :width="24" :height="24" />
      </template>
      <template #section>
        <MRow paddingX="md" align="center" justify="between">
          <MText variant="overline">The itinerary</MText>
          <MBox id="trip-section" :width="24" :height="24" />
        </MRow>
      </template>
      <MColumn padding="lg" gap="md">
        <MText id="trip-first">First light</MText>
        <MCard id="trip-trail">
          <MText>The hidden trail</MText>
          <MBox :height="72" />
        </MCard>
        <MCard>
          <MText>Lunch with a view</MText>
          <MBox :height="72" />
        </MCard>
        <MCard>
          <MText>An afternoon outside</MText>
          <MBox :height="72" />
        </MCard>
        <MCard>
          <MText>The blue hour</MText>
          <MBox :height="72" />
        </MCard>
      </MColumn>
    </MCollapsibleHeader>
    <MText>{{ `Went back ${state.backs}` }}</MText>
  </MColumn>
</template>
