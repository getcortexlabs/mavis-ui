<script setup lang="ts">
import { ref } from 'vue'
import type { VirtualListHandle } from '@getcortexlabs/mavis-core'
const list = ref<VirtualListHandle>()
const items = ref(Array.from({ length: 200 }, (_, id) => ({ id, draft: '' })))
const animated = ref(true)
const visible = ref(true)
let inserted = -1
function reset() {
  items.value = Array.from({ length: 200 }, (_, id) => ({ id, draft: '' }))
  list.value?.scrollToIndex(0)
}
</script>

<template>
  <MScreen>
    <MColumn padding="md" gap="sm">
      <MText text="Keyed list changes" variant="title" />
      <MRow gap="sm" wrap>
        <MButton
          id="virtual-middle"
          text="Middle"
          @click="list?.scrollToIndex(items.findIndex((item) => item.id === 50))"
        />
        <MButton id="virtual-last" text="Last" @click="list?.scrollToIndex(items.length - 1)" />
        <MButton
          id="virtual-prepend"
          text="Prepend"
          @click="items = [{ id: inserted--, draft: '' }, ...items]"
        />
        <MButton id="virtual-reverse" text="Reverse" @click="items = [...items].reverse()" />
      </MRow>
      <MRow gap="sm" wrap>
        <MButton
          id="virtual-filter"
          text="Even only"
          @click="items = items.filter((item) => item.id % 2 === 0)"
        />
        <MButton
          id="virtual-remove"
          text="Remove 50"
          @click="items = items.filter((item) => item.id !== 50)"
        />
        <MButton id="virtual-reset" text="Reset" @click="reset" />
        <MButton
          id="virtual-toggle-motion"
          :text="animated ? 'Motion on' : 'Motion off'"
          @click="animated = !animated"
        />
        <MButton
          id="virtual-hide"
          :text="visible ? 'Hide list' : 'Show list'"
          @click="visible = !visible"
        />
      </MRow>
      <MVirtualList
        v-if="visible"
        id="virtual-changes-list"
        ref="list"
        :items="items"
        itemKey="id"
        :rowHeight="80"
        :height="320"
        :animated="animated"
        label="Two hundred records"
      >
        <template #default="{ item }">
          <MRow :id="`virtual-row-${item.id}`" :height="80" gap="sm" paddingX="xs">
            <MColumn :width="72" justify="center"><MText :text="`Row ${item.id}`" /></MColumn>
            <MInput
              :id="`virtual-draft-${item.id}`"
              v-model="item.draft"
              :label="`Draft ${item.id}`"
              :grow="1"
            />
          </MRow>
        </template>
      </MVirtualList>
      <MText
        id="virtual-changes-state"
        :text="`${items.length}|${items.find((item) => item.id === 50)?.draft ?? 'removed'}|${animated}|${visible}`"
      />
    </MColumn>
  </MScreen>
</template>
