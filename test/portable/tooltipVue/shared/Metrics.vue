<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MRow, MScreen, MText, MTooltip } from '#mavis'

const locked = ref(false)
const detailed = ref(false)
</script>

<template>
  <MScreen>
    <MColumn id="page" gap="lg" padding="lg">
      <MColumn id="top" :height="120" />
      <MRow id="active" gap="sm">
        <MTooltip
          id="active-help"
          triggerLabel="About active members"
          :text="
            detailed
              ? 'Members who opened the app in the last seven days, counted once.'
              : 'Active in the last seven days.'
          "
        />
        <MText>Active members</MText>
      </MRow>
      <MRow id="revenue" gap="sm">
        <MColumn :grow="1"><MText>Revenue</MText></MColumn>
        <m-tooltip
          id="revenue-help"
          triggerLabel="About revenue"
          text="Paid invoices, before refunds."
          icon="circle-question-mark"
          variant="secondary"
          placement="bottom-end"
          :disabled="locked"
        />
      </MRow>
      <MRow gap="sm">
        <MButton text="More detail" @click="detailed = !detailed" />
        <MButton text="Lock" @click="locked = !locked" />
      </MRow>
    </MColumn>
  </MScreen>
</template>
