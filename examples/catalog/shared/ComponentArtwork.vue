<script setup lang="ts">
import { computed } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const props = defineProps<{ id: string }>()
const { theme } = useMavisTheme()
const blue = computed(() => ['slider', 'text', 'column', 'screen'].includes(props.id))
const color = computed(() => (blue.value ? theme.value.colors.accent : theme.value.colors.primary))
const soft = computed(() =>
  blue.value ? theme.value.colors.accentSoft : theme.value.colors.primarySoft,
)
</script>

<template>
  <m-column
    :height="132"
    padding="sm"
    radius="md"
    align="stretch"
    justify="center"
    :backgroundColor="soft"
    :accessibilityHidden="true"
  >
    <m-column v-if="id === 'button'" gap="sm" align="center">
      <m-column paddingX="md" paddingY="sm" radius="full" :backgroundColor="color">
        <m-text variant="caption" tone="onPrimary">Mavis ↗</m-text>
      </m-column>
      <m-row gap="xs">
        <m-box :width="6" :height="6" radius="full" :backgroundColor="color" />
        <m-box :width="6" :height="6" radius="full" :backgroundColor="theme.colors.surface" />
        <m-box :width="6" :height="6" radius="full" :backgroundColor="theme.colors.surface" />
      </m-row>
    </m-column>
    <m-column v-else-if="id === 'input'" gap="sm">
      <m-text variant="caption" tone="primary">Seu nome</m-text>
      <m-row padding="sm" radius="sm" gap="xs" :backgroundColor="theme.colors.surface">
        <m-text variant="heading">Mavis</m-text>
        <m-box :width="2" :height="22" :backgroundColor="color" />
      </m-row>
      <m-box width="55%" :height="4" radius="full" :backgroundColor="color" />
    </m-column>
    <m-row v-else-if="id === 'icon'" gap="lg" justify="center" align="center">
      <m-icon name="heart" :size="30" tone="primary" />
      <m-icon name="star" :size="42" tone="accent" />
      <m-icon name="bell" :size="30" tone="primary" />
    </m-row>
    <m-column v-else-if="id === 'switch'" align="center" gap="sm">
      <m-row
        :width="80"
        :height="42"
        :padding="5"
        radius="full"
        justify="end"
        :backgroundColor="color"
      >
        <m-box :width="32" :height="32" radius="full" :backgroundColor="theme.colors.onPrimary" />
      </m-row>
      <m-row
        :width="80"
        :height="42"
        :padding="5"
        radius="full"
        :backgroundColor="theme.colors.muted"
      >
        <m-box :width="32" :height="32" radius="full" :backgroundColor="theme.colors.surface" />
      </m-row>
    </m-column>
    <m-column v-else-if="id === 'slider'" gap="md">
      <m-row justify="between" align="end">
        <m-text variant="heading" tone="accent">72</m-text>
        <m-text variant="caption" tone="accent">%</m-text>
      </m-row>
      <m-row gap="none">
        <m-box :grow="7" :width="0" :height="6" radius="full" :backgroundColor="color" />
        <m-box :width="18" :height="18" radius="full" :backgroundColor="color" />
        <m-box
          :grow="3"
          :width="0"
          :height="6"
          radius="full"
          :backgroundColor="theme.colors.surface"
        />
      </m-row>
    </m-column>
    <m-column
      v-else-if="id === 'card'"
      padding="sm"
      gap="sm"
      radius="sm"
      :backgroundColor="theme.colors.surface"
    >
      <m-row justify="between">
        <m-box :width="26" :height="26" radius="sm" :backgroundColor="color" />
        <m-text variant="caption" tone="primary">✦</m-text>
      </m-row>
      <m-box width="72%" :height="5" radius="full" :backgroundColor="theme.colors.border" />
      <m-box width="45%" :height="5" radius="full" :backgroundColor="soft" />
    </m-column>
    <m-column v-else-if="id === 'text'" align="center">
      <m-text variant="display" tone="accent">Aa</m-text>
      <m-text variant="overline" tone="accent">TYPE &amp; TONE</m-text>
    </m-column>
    <m-row v-else-if="id === 'row'" gap="xs" align="stretch">
      <m-box
        v-for="n in 3"
        :key="n"
        :grow="1"
        :width="0"
        :height="64"
        radius="sm"
        :backgroundColor="n === 2 ? theme.colors.accent : color"
      />
    </m-row>
    <m-column v-else-if="id === 'column'" gap="xs">
      <m-box
        v-for="n in 3"
        :key="n"
        :height="20"
        radius="sm"
        :backgroundColor="n === 2 ? theme.colors.primary : color"
      />
    </m-column>
    <m-box v-else-if="id === 'box'" :height="90">
      <m-column align="start" justify="start">
        <m-box :width="70" :height="64" radius="sm" :backgroundColor="theme.colors.accent" />
      </m-column>
      <m-column align="end" justify="end">
        <m-column
          :width="70"
          :height="64"
          radius="sm"
          align="center"
          justify="center"
          :backgroundColor="color"
        >
          <m-text variant="heading" tone="onPrimary">✦</m-text>
        </m-column>
      </m-column>
    </m-box>
    <m-column v-else-if="id === 'screen'" align="center">
      <m-column
        :width="64"
        :height="100"
        :padding="7"
        radius="sm"
        gap="xs"
        :backgroundColor="color"
      >
        <m-box :width="20" :height="4" radius="full" :backgroundColor="theme.colors.onAccent" />
        <m-box :height="38" radius="sm" :backgroundColor="soft" />
        <m-box :height="26" radius="sm" :backgroundColor="theme.colors.onAccent" />
      </m-column>
    </m-column>
    <m-column v-else-if="id === 'sheet'" align="center">
      <m-column :width="64" :height="100" :padding="7" radius="sm" gap="xs" :backgroundColor="soft">
        <m-box :width="20" :height="4" radius="full" :backgroundColor="theme.colors.border" />
        <m-box :height="20" radius="sm" :backgroundColor="theme.colors.surface" />
        <m-column :grow="1" :height="0" justify="end">
          <m-column :padding="6" radius="sm" gap="xs" :backgroundColor="color">
            <m-box
              :width="14"
              :height="3"
              radius="full"
              :backgroundColor="theme.colors.onPrimary"
            />
            <m-box :height="14" radius="sm" :backgroundColor="theme.colors.primarySoft" />
          </m-column>
        </m-column>
      </m-column>
    </m-column>
    <m-row v-else gap="sm" justify="center" align="end">
      <m-box :width="24" :height="30" radius="sm" :backgroundColor="theme.colors.border" />
      <m-box :width="24" :height="50" radius="sm" :backgroundColor="theme.colors.accent" />
      <m-box :width="24" :height="72" radius="sm" :backgroundColor="color" />
    </m-row>
  </m-column>
</template>
