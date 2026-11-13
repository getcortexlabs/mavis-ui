<script setup lang="ts">
import { ref } from 'vue'

const wifi = ref(true)
const sync = ref(false)
const locked = ref(true)

// The source keeps sync off while the settings are locked.
function choose(next: boolean) {
  if (!locked.value) sync.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MBox id="wifi-box">
      <MSwitch v-model="wifi" label="Wi-Fi" />
    </MBox>
    <MText>{{ wifi ? 'Wi-Fi on' : 'Wi-Fi off' }}</MText>
    <MBox id="sync-box">
      <m-switch
        id="sync"
        label="Sync"
        helper-text="Keeps this Mac up to date"
        :model-value="sync"
        @update:model-value="choose"
      />
    </MBox>
    <MText>Sync {{ sync ? 'on' : 'off' }}</MText>
    <MSwitch v-model="locked" label="Locked" />
    <MSwitch v-model="wifi" label="Managed" helper-text="Set by your team" disabled />
    <MRow gap="md">
      <MBox id="compact-box">
        <MSwitch label="Compact" :model-value="sync" @update:model-value="choose" />
      </MBox>
      <MText id="beside" :grow="1">Beside</MText>
    </MRow>
  </MColumn>
</template>
