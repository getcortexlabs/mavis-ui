<script setup lang="ts">
import { ref, onMounted } from 'vue'
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
import type { ChoiceValue, VirtualListHandle } from '@getcortexlabs/mavis-core'
const popover = ref(false)
const menu = ref(false)
const action = ref<ChoiceValue>('none')
const query = ref('')
const time = ref<string | null>('09:30')
const route = ref('home')
const backs = ref(0)
const list = ref<VirtualListHandle>()
const items = ref(Array.from({ length: 1000 }, (_, index) => ({ id: index + 1, saved: false })))
</script>

<template>
  <MScreen>
    <MText
      id="collection-ready"
      :text="ready ? 'ready' : 'pending'"
      variant="caption"
      :accessibilityHidden="true"
    />
    <MAppBar
      id="collection-app-bar"
      title="Collections"
      back
      :navigateBack="
        () => {
          backs++
        }
      "
    >
      <template #actions>
        <MMenu
          v-model:open="menu"
          label="Collection actions"
          triggerLabel="Actions"
          :items="[
            { value: 'edit', label: 'Edit' },
            { value: 'blocked', label: 'Blocked', disabled: true },
            { value: 'remove', label: 'Remove', destructive: true },
          ]"
          @select="(value) => (action = value)"
        />
      </template>
    </MAppBar>
    <MColumn padding="md" gap="sm">
      <MRow gap="sm">
        <MPopover v-model:open="popover" label="Filters" triggerLabel="Filters">
          <template #default="{ close }"
            ><MColumn gap="sm"
              ><MInput id="collection-query" v-model="query" label="Query" /><MButton
                text="Apply filters"
                @click="close" /></MColumn
          ></template>
        </MPopover>
        <MButton
          id="collection-last"
          text="Last"
          variant="ghost"
          @click="list?.scrollToIndex(items.length - 1)"
        />
        <MButton
          id="collection-reverse"
          text="Reverse"
          variant="ghost"
          @click="items = [...items].reverse()"
        />
      </MRow>
      <MTimePicker
        id="collection-time"
        v-model="time"
        label="Meeting time"
        min="08:00"
        max="18:00"
        :minuteStep="15"
      />
      <MVirtualList
        id="collection-list"
        ref="list"
        :items="items"
        itemKey="id"
        label="Collections"
        :rowHeight="56"
        :height="224"
      >
        <template #default="{ item }"
          ><MRow :id="`collection-row-${item.id}`" :height="56" gap="sm"
            ><MText :text="`Collection ${item.id}`" :grow="1" /><MButton
              :text="item.saved ? 'Saved' : 'Save'"
              :accessibilityLabel="`Save ${item.id}`"
              variant="ghost"
              @click="item.saved = !item.saved" /></MRow
        ></template>
      </MVirtualList>
      <MText
        id="collection-state"
        :text="`${backs}|${action}|${query}|${time}|${route}|${items.find((item) => item.id === 1)?.saved}`"
        variant="caption"
      />
    </MColumn>
    <MTabBar
      :modelValue="route"
      label="Destinations"
      :items="[
        {
          value: 'home',
          label: 'Home',
          icon: 'house',
          href: '/home',
          navigate: async () => {
            route = 'home'
          },
        },
        {
          value: 'saved',
          label: 'Saved collections',
          icon: 'bookmark',
          badge: 3,
          href: '/saved',
          navigate: async () => {
            route = 'saved'
          },
        },
      ]"
    />
  </MScreen>
</template>
