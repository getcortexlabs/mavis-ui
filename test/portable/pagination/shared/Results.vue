<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  page: 1 as number,
  total: 95 as number,
  busy: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MColumn id="pager">
      <MPagination
        :total="state.total"
        :pageSize="10"
        :modelValue="state.page"
        @update:modelValue="(value) => (state.page = value)"
        :statusText="`Page ${state.page} of ${state.total} results`"
        :loading="state.busy"
      />
    </MColumn>
    <MRow id="tools" gap="sm" :wrap="true">
      <MButton text="Fewer" variant="ghost" @click="() => (state.total = 25)" />
      <MButton text="None" variant="ghost" @click="() => (state.total = 0)" />
      <MButton text="Busy" variant="ghost" @click="() => (state.busy = !state.busy)" />
    </MRow>
    <MPagination :total="45" :pageSize="10" :siblingCount="0" previousLabel="Back" nextLabel="On" />
  </MColumn>
</template>
