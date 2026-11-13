<script setup lang="ts">
import { ref } from 'vue'

const page = ref(1)
const total = ref(95)
const busy = ref(false)
</script>

<template>
  <MColumn gap="md">
    <MColumn id="pager">
      <MPagination
        v-model="page"
        :total="total"
        :page-size="10"
        :status-text="`Page ${page} of ${total} results`"
        :loading="busy"
      />
    </MColumn>
    <MRow id="tools" gap="sm" wrap>
      <MButton variant="ghost" @click="total = 25">Fewer</MButton>
      <MButton variant="ghost" @click="total = 0">None</MButton>
      <MButton variant="ghost" @click="busy = !busy">Busy</MButton>
    </MRow>
    <m-pagination
      :total="45"
      :page-size="10"
      :sibling-count="0"
      previous-label="Back"
      next-label="On"
    />
  </MColumn>
</template>
