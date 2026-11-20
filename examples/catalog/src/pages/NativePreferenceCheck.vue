<script setup lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref } from 'nativescript-vue'
import { onReducedMotion, reducedMotion } from '@rafaelaugusto/jolt'
const later = ref(false),
  mounted = ref(true),
  active = ref(true)
const effective = ref(reducedMotion())
const off = onReducedMotion((value) => (effective.value = value))
onBeforeUnmount(off)
const Kept = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
})
const categories = [
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B' },
]
const series = computed(() => [
  { key: 'visits', label: 'Visits', values: later.value ? [80, 100] : [20, 100] },
])
const size = computed(() => (later.value ? 70 : 30))
</script>
<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="md">
      <MText variant="heading">Effective motion preference</MText>
      <MText id="preference-policy">{{ effective ? 'Reduced motion' : 'Motion enabled' }}</MText>
      <MRow gap="sm" wrap>
        <MButton id="preference-change" text="Update values" @click="later = !later" />
        <MButton
          id="preference-mount"
          :text="mounted ? 'Unmount' : 'Mount'"
          @click="mounted = !mounted"
        />
        <MButton
          id="preference-active"
          :text="active ? 'Deactivate' : 'Activate'"
          @click="active = !active"
        />
      </MRow>
      <KeepAlive v-if="mounted">
        <Kept v-if="active">
          <MColumn id="preference-region" gap="md">
            <MChart
              :categories="categories"
              :series="series"
              type="bar"
              :height="160"
              label="Visits"
            />
            <MNumberFlow
              id="preference-number"
              :value="later ? 800 : 200"
              label="Total"
              locale="en-US"
            />
            <MResizablePanels :modelValue="size" :height="100" label="Layout">
              <template #primary
                ><MColumn id="preference-primary"><MText>Notes</MText></MColumn></template
              >
              <template #secondary><MText>Editor</MText></template>
            </MResizablePanels>
          </MColumn>
        </Kept>
      </KeepAlive>
    </MColumn>
  </MScreen>
</template>
