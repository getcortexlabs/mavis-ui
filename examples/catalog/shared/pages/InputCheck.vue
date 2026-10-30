<script setup lang="ts">
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const value = ref('ab')
const secret = ref('private-test-value')
const bio = ref('First')
const disabled = ref(false)
const readonly = ref(false)
const action = ref<'done' | 'search' | 'go' | 'send'>('done')
const input = ref<InputHandle>()
const submits = ref(0)
const focused = ref(false)
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-text variant="title">Input checks</m-text>
      <m-input
        ref="input"
        id="input-check-value"
        v-model="value"
        label="Value"
        :maxLength="3"
        :disabled="disabled"
        :readonly="readonly"
        :returnKey="action"
        :autocorrect="false"
        autocapitalize="none"
        @submit="submits++"
        @focus="focused = true"
        @blur="focused = false"
      />
      <m-text id="input-check-state"
        >{{ value }} · {{ focused ? 'focused' : 'blurred' }} · submits {{ submits }}</m-text
      >
      <m-input id="input-check-password" v-model="secret" label="Password" type="password" />
      <m-input id="input-check-bio" v-model="bio" label="Multiline" multiline :rows="1" />
      <m-button @click="value = '012345'">External reset</m-button>
      <m-button @click="value = 'ab'">Short reset</m-button>
      <m-row gap="sm" wrap>
        <m-button variant="secondary" @click="disabled = !disabled">{{
          disabled ? 'Enable' : 'Disable'
        }}</m-button>
        <m-button variant="secondary" @click="readonly = !readonly">{{
          readonly ? 'Editable' : 'Read only'
        }}</m-button>
        <m-button variant="secondary" @click="input?.focus()">Focus</m-button>
        <m-button variant="secondary" @click="input?.blur()">Blur</m-button>
      </m-row>
      <m-row gap="sm" wrap>
        <m-button
          v-for="key in ['done', 'search', 'go', 'send'] as const"
          :key="key"
          size="sm"
          variant="ghost"
          @click="action = key"
          >{{ key }}</m-button
        >
      </m-row>
    </m-column>
  </m-screen>
</template>
