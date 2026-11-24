<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  wifi: true as boolean,
  sync: false as boolean,
  locked: true as boolean,
  choose(next: boolean): void {
    if (!state.locked) {
      state.sync = next
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MBox id="wifi-box">
      <MSwitch
        label="Wi-Fi"
        :modelValue="state.wifi"
        @update:modelValue="(value) => (state.wifi = value)"
      />
    </MBox>
    <MText>{{ state.wifi ? 'Wi-Fi on' : 'Wi-Fi off' }}</MText>
    <MBox id="sync-box">
      <MSwitch
        id="sync"
        label="Sync"
        helperText="Keeps this Mac up to date"
        :modelValue="state.sync"
        @update:modelValue="(next) => state.choose(next)"
      />
    </MBox>
    <MText>{{ `Sync ${state.sync ? 'on' : 'off'}` }}</MText>
    <MSwitch
      label="Locked"
      :modelValue="state.locked"
      @update:modelValue="(value) => (state.locked = value)"
    />
    <MSwitch
      label="Managed"
      helperText="Set by your team"
      :modelValue="state.wifi"
      @update:modelValue="(value) => (state.wifi = value)"
      :disabled="true"
    />
    <MRow gap="md">
      <MBox id="compact-box">
        <MSwitch
          label="Compact"
          :modelValue="state.sync"
          @update:modelValue="(next) => state.choose(next)"
        />
      </MBox>
      <MText id="beside" :grow="1">Beside</MText>
    </MRow>
  </MColumn>
</template>
