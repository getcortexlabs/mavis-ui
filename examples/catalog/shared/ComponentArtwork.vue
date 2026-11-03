<script setup lang="ts">
import { useCatalogLocale } from './locale'
import { computed } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t } = useCatalogLocale()

const props = defineProps<{ id: string }>()
const { theme } = useMavisTheme()
const blue = computed(() =>
  [
    'date-range-picker',
    'pagination',
    'form-errors',
    'empty-state',
    'select',
    'radio',
    'slider',
    'text',
    'column',
    'screen',
    'progress',
    'segmented-control',
  ].includes(props.id),
)
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
    <m-row
      v-if="['popover', 'menu', 'app-bar', 'tab-bar', 'time-picker', 'virtual-list'].includes(id)"
      gap="md"
      padding="md"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-icon
        :name="
          id === 'time-picker'
            ? 'clock'
            : id === 'virtual-list'
              ? 'list'
              : id === 'menu'
                ? 'ellipsis'
                : id === 'popover'
                  ? 'message-circle'
                  : id === 'app-bar'
                    ? 'arrow-left'
                    : 'compass'
        "
        :size="32"
      />
      <m-column gap="sm" :grow="1"
        ><m-box
          v-for="n in 3"
          :key="n"
          :height="6"
          :width="n === 2 ? '70%' : '100%'"
          radius="full"
          :backgroundColor="color"
      /></m-column>
    </m-row>
    <m-column v-else-if="['date-picker', 'date-range-picker'].includes(id)" gap="sm" align="center">
      <m-icon name="calendar" :size="24" :tone="blue ? 'accent' : 'primary'" />
      <m-row v-for="row in 2" :key="row" gap="xs"
        ><m-box
          v-for="day in 7"
          :key="day"
          :width="12"
          :height="12"
          radius="sm"
          :backgroundColor="
            (id === 'date-range-picker' ? day > 2 && day < 6 : day === 4 && row === 2)
              ? color
              : theme.colors.surface
          "
      /></m-row>
    </m-column>
    <m-column v-else-if="id === 'combobox'" gap="xs">
      <m-row padding="sm" radius="md" gap="sm" :backgroundColor="theme.colors.surface"
        ><m-icon name="search" size="sm" :tone="blue ? 'accent' : 'primary'" /><m-box
          :width="50"
          :height="6"
          radius="full"
          :backgroundColor="color"
      /></m-row>
      <m-row v-for="n in 2" :key="n" paddingX="sm" gap="sm"
        ><m-box :width="7" :height="7" radius="full" :backgroundColor="color" /><m-box
          :width="n === 1 ? 65 : 45"
          :height="5"
          radius="full"
          :backgroundColor="color"
      /></m-row>
    </m-column>
    <m-column v-else-if="id === 'file-picker'" gap="sm" align="center"
      ><m-icon name="file-text" :size="36" :tone="blue ? 'accent' : 'primary'" /><m-row gap="xs"
        ><m-box :width="54" :height="5" radius="full" :backgroundColor="color" /><m-box
          :width="18"
          :height="5"
          radius="full"
          :backgroundColor="theme.colors.surface" /></m-row
    ></m-column>
    <m-column
      v-else-if="['form-group', 'form-errors'].includes(id)"
      gap="sm"
      padding="sm"
      radius="md"
      :backgroundColor="theme.colors.surface"
      ><m-text variant="caption" :tone="blue ? 'accent' : 'primary'">{{
        t(id === 'form-errors' ? '↗ Revisar' : 'Seu encontro')
      }}</m-text
      ><m-box v-for="n in 2" :key="n" :height="15" radius="sm" :backgroundColor="soft"
    /></m-column>
    <m-row v-else-if="['steps', 'pagination'].includes(id)" gap="sm" justify="center"
      ><m-column
        v-for="n in 3"
        :key="n"
        :width="28"
        :height="28"
        radius="full"
        align="center"
        justify="center"
        :backgroundColor="n === 2 ? color : theme.colors.surface"
        ><m-text variant="caption" :tone="n === 2 ? 'onPrimary' : blue ? 'accent' : 'primary'">{{
          t(n)
        }}</m-text></m-column
      ></m-row
    >
    <m-column v-else-if="id === 'button'" gap="sm" align="center">
      <m-column paddingX="md" paddingY="sm" radius="full" :backgroundColor="color">
        <m-text variant="caption" tone="onPrimary">{{ t('Mavis ↗') }}</m-text>
      </m-column>
      <m-row gap="xs">
        <m-box :width="6" :height="6" radius="full" :backgroundColor="color" />
        <m-box :width="6" :height="6" radius="full" :backgroundColor="theme.colors.surface" />
        <m-box :width="6" :height="6" radius="full" :backgroundColor="theme.colors.surface" />
      </m-row>
    </m-column>
    <m-column v-else-if="id === 'chip'" gap="sm" align="center">
      <m-row paddingX="md" paddingY="sm" gap="xs" radius="full" :backgroundColor="color"
        ><m-icon name="check" tone="onPrimary" size="sm" /><m-text
          variant="caption"
          tone="onPrimary"
          >{{ t('Design') }}</m-text
        ></m-row
      >
      <m-row
        paddingX="md"
        paddingY="sm"
        gap="sm"
        radius="full"
        :backgroundColor="theme.colors.surface"
        ><m-text variant="caption">{{ t('Vue') }}</m-text
        ><m-icon name="x" size="sm" tone="muted"
      /></m-row>
    </m-column>
    <m-column v-else-if="id === 'empty-state'" gap="sm" align="center">
      <m-column
        :width="48"
        :height="48"
        radius="full"
        align="center"
        justify="center"
        :backgroundColor="theme.colors.surface"
        ><m-icon name="inbox" tone="accent"
      /></m-column>
      <m-box width="65%" :height="6" radius="full" :backgroundColor="color" />
      <m-box width="40%" :height="4" radius="full" :backgroundColor="theme.colors.border" />
      <m-box :width="52" :height="14" radius="full" :backgroundColor="color" />
    </m-column>
    <m-column v-else-if="id === 'accordion'" gap="xs">
      <m-column padding="sm" radius="sm" gap="sm" :backgroundColor="theme.colors.surface"
        ><m-row justify="between"
          ><m-box width="65%" :height="6" radius="full" :backgroundColor="color" /><m-icon
            name="chevron-up"
            size="sm"
            tone="primary" /></m-row
        ><m-box
          width="90%"
          :height="4"
          radius="full"
          :backgroundColor="theme.colors.border" /><m-box
          width="60%"
          :height="4"
          radius="full"
          :backgroundColor="theme.colors.border"
      /></m-column>
      <m-row padding="sm" radius="sm" justify="between" :backgroundColor="theme.colors.surface"
        ><m-box width="55%" :height="6" radius="full" :backgroundColor="color" /><m-icon
          name="chevron-down"
          size="sm"
          tone="primary"
      /></m-row>
    </m-column>
    <m-column v-else-if="id === 'segmented-control'" gap="md">
      <m-row padding="xs" gap="xs" radius="md" :backgroundColor="theme.colors.surface"
        ><m-column
          v-for="n in 3"
          :key="n"
          :width="0"
          :grow="1"
          :height="34"
          radius="sm"
          align="center"
          justify="center"
          :backgroundColor="n === 2 ? color : theme.colors.elevated"
          ><m-box
            :width="14"
            :height="4"
            radius="full"
            :backgroundColor="n === 2 ? theme.colors.surface : color" /></m-column
      ></m-row>
      <m-row gap="sm" :height="28" align="end"
        ><m-box
          v-for="n in 5"
          :key="n"
          :width="0"
          :grow="1"
          :height="8 + n * 4"
          radius="sm"
          :backgroundColor="color"
      /></m-row>
    </m-column>
    <m-column v-else-if="id === 'progress'" gap="md">
      <m-row justify="between" align="end"
        ><m-text variant="title" tone="accent">72%</m-text
        ><m-icon name="download" tone="accent" size="sm"
      /></m-row>
      <m-progress
        :value="72"
        :label="t('Progresso demonstrativo')"
        tone="accent"
        size="lg"
        :accessibilityHidden="true"
      />
      <m-box width="45%" :height="5" radius="full" :backgroundColor="theme.colors.surface" />
    </m-column>
    <m-column
      v-else-if="id === 'alert'"
      gap="sm"
      padding="sm"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-row gap="sm"
        ><m-icon name="circle-check" tone="primary" /><m-box
          :width="48"
          :height="7"
          radius="full"
          :backgroundColor="color"
      /></m-row>
      <m-box width="90%" :height="5" radius="full" :backgroundColor="theme.colors.border" />
      <m-box width="60%" :height="5" radius="full" :backgroundColor="theme.colors.border" />
    </m-column>
    <m-column v-else-if="id === 'input'" gap="sm">
      <m-text variant="caption" tone="primary">{{ t('Seu nome') }}</m-text>
      <m-row padding="sm" radius="sm" gap="xs" :backgroundColor="theme.colors.surface">
        <m-text variant="heading">{{ t('Mavis') }}</m-text>
        <m-box :width="2" :height="22" :backgroundColor="color" />
      </m-row>
      <m-box width="55%" :height="4" radius="full" :backgroundColor="color" />
    </m-column>
    <m-row v-else-if="id === 'icon'" gap="lg" justify="center" align="center">
      <m-icon name="heart" :size="30" tone="primary" />
      <m-icon name="star" :size="42" tone="accent" />
      <m-icon name="bell" :size="30" tone="primary" />
    </m-row>
    <m-column
      v-else-if="id === 'list-item'"
      gap="sm"
      padding="sm"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-row gap="sm"
        ><m-avatar name="Marina Costa" size="sm" :accessibilityHidden="true" /><m-column
          :width="0"
          :grow="1"
          gap="xs"
          ><m-box width="80%" :height="6" radius="full" :backgroundColor="color" /><m-box
            width="55%"
            :height="4"
            radius="full"
            :backgroundColor="theme.colors.border" /></m-column
        ><m-icon name="chevron-right" size="sm" tone="muted"
      /></m-row>
      <m-separator /><m-row gap="sm"
        ><m-avatar name="Noah Kim" size="sm" :accessibilityHidden="true" /><m-box
          :width="0"
          :grow="1"
          :height="6"
          radius="full"
          :backgroundColor="color"
      /></m-row>
    </m-column>
    <m-column
      v-else-if="id === 'separator'"
      gap="md"
      padding="md"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-box :height="8" width="65%" radius="full" :backgroundColor="color" /><m-separator /><m-row
        :height="24"
        justify="center"
        ><m-icon name="sparkles" tone="primary" /><m-separator
          orientation="vertical"
          spacing="md" /><m-icon name="heart" tone="accent"
      /></m-row>
    </m-column>
    <m-row v-else-if="id === 'avatar'" gap="sm" justify="center">
      <m-avatar name="Mavis Studio" size="lg" :accessibilityHidden="true" />
      <m-avatar shape="square" :accessibilityHidden="true" />
    </m-row>
    <m-column v-else-if="id === 'badge'" gap="sm" align="center">
      <m-badge :text="t('Destaque')" tone="primary" :accessibilityHidden="true" />
      <m-row gap="sm" justify="center"
        ><m-badge :text="t('Design')" tone="accent" size="sm" :accessibilityHidden="true" /><m-badge
          :text="t(8)"
          size="sm"
          :accessibilityHidden="true"
      /></m-row>
    </m-column>
    <m-column
      v-else-if="id === 'skeleton'"
      gap="sm"
      padding="sm"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-row gap="sm">
        <m-skeleton :width="28" :height="28" radius="full" :shrink="0" :animated="false" />
        <m-column :width="0" :grow="1" gap="xs"
          ><m-skeleton :height="6" :animated="false" /><m-skeleton
            width="60%"
            :height="6"
            :animated="false"
        /></m-column>
      </m-row>
      <m-skeleton :height="28" radius="sm" :animated="false" />
      <m-skeleton width="70%" :height="6" :animated="false" />
    </m-column>
    <m-column
      v-else-if="id === 'tabs'"
      gap="sm"
      padding="sm"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-row gap="sm"
        ><m-box :width="40" :height="6" radius="full" :backgroundColor="color" /><m-box
          :width="30"
          :height="6"
          radius="full"
          :backgroundColor="theme.colors.border"
      /></m-row>
      <m-box
        :width="40"
        :height="3"
        radius="full"
        :backgroundColor="color"
        :style="{ alignSelf: 'flex-start' }"
      />
      <m-column padding="sm" radius="sm" gap="xs" :backgroundColor="soft">
        <m-box width="75%" :height="5" radius="full" :backgroundColor="color" />
        <m-box width="55%" :height="4" radius="full" :backgroundColor="theme.colors.muted" />
      </m-column>
    </m-column>
    <m-column
      v-else-if="id === 'dialog'"
      padding="sm"
      gap="sm"
      radius="md"
      :backgroundColor="theme.colors.surface"
    >
      <m-icon name="circle-check" tone="primary" :size="22" />
      <m-box width="75%" :height="5" radius="full" :backgroundColor="color" />
      <m-box width="95%" :height="4" radius="full" :backgroundColor="theme.colors.border" />
      <m-row gap="xs">
        <m-box :grow="1" :width="0" :height="20" radius="sm" :backgroundColor="soft" />
        <m-box :grow="1" :width="0" :height="20" radius="sm" :backgroundColor="color" />
      </m-row>
    </m-column>
    <m-column v-else-if="id === 'toast'" gap="xs">
      <m-row padding="sm" gap="sm" radius="sm" :backgroundColor="theme.colors.surface">
        <m-icon name="circle-check" tone="primary" :size="22" />
        <m-column gap="sm" :grow="1" :width="0">
          <m-box width="80%" :height="5" radius="full" :backgroundColor="color" />
          <m-box width="60%" :height="4" radius="full" :backgroundColor="theme.colors.muted" />
        </m-column>
        <m-icon name="x" tone="muted" :size="12" />
      </m-row>
      <m-box
        width="80%"
        :height="5"
        radius="full"
        :backgroundColor="color"
        :style="{ opacity: 0.2, horizontalAlignment: 'center' }"
      />
    </m-column>
    <m-column v-else-if="id === 'select'" gap="xs">
      <m-row
        padding="sm"
        gap="sm"
        justify="between"
        radius="sm"
        :backgroundColor="theme.colors.surface"
      >
        <m-box :width="52" :height="6" radius="full" :backgroundColor="color" />
        <m-icon name="chevron-down" tone="accent" :size="18" />
      </m-row>
      <m-column padding="sm" gap="sm" radius="sm" :backgroundColor="theme.colors.surface">
        <m-row gap="sm" justify="between"
          ><m-box :width="60" :height="5" radius="full" :backgroundColor="color" /><m-icon
            name="check"
            tone="accent"
            :size="14"
        /></m-row>
        <m-box :width="44" :height="5" radius="full" :backgroundColor="theme.colors.muted" />
      </m-column>
    </m-column>
    <m-column v-else-if="id === 'radio'" gap="sm" align="center">
      <m-row v-for="n in 2" :key="n" gap="sm">
        <m-column
          :width="36"
          :height="36"
          radius="full"
          align="center"
          justify="center"
          :style="{ borderWidth: 3, borderColor: color }"
        >
          <m-box v-if="n === 1" :width="18" :height="18" radius="full" :backgroundColor="color" />
        </m-column>
        <m-box
          :width="48"
          :height="6"
          radius="full"
          :backgroundColor="n === 1 ? color : theme.colors.muted"
        />
      </m-row>
    </m-column>
    <m-column v-else-if="id === 'checkbox'" gap="sm" align="center">
      <m-row gap="sm">
        <m-column
          :width="36"
          :height="36"
          radius="sm"
          align="center"
          justify="center"
          :backgroundColor="color"
        >
          <m-icon name="check" :size="24" tone="onPrimary" />
        </m-column>
        <m-box :width="48" :height="6" radius="full" :backgroundColor="color" />
      </m-row>
      <m-row gap="sm">
        <m-column
          :width="36"
          :height="36"
          radius="sm"
          align="center"
          justify="center"
          :backgroundColor="color"
        >
          <m-box :width="16" :height="3" radius="full" :backgroundColor="theme.colors.onPrimary" />
        </m-column>
        <m-box :width="48" :height="6" radius="full" :backgroundColor="theme.colors.muted" />
      </m-row>
    </m-column>
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
      <m-text variant="display" tone="accent">{{ t('Aa') }}</m-text>
      <m-text variant="overline" tone="accent">{{ t('TYPE & TONE') }}</m-text>
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
    <m-row v-else-if="id === 'number-input'" gap="sm" align="center" justify="center">
      <m-column
        :width="28"
        :height="32"
        radius="sm"
        :backgroundColor="soft"
        align="center"
        justify="center"
        ><m-text tone="primary">−</m-text></m-column
      >
      <m-text variant="title" tone="primary">04</m-text>
      <m-column
        :width="28"
        :height="32"
        radius="sm"
        :backgroundColor="color"
        align="center"
        justify="center"
        ><m-text tone="onPrimary">+</m-text></m-column
      >
    </m-row>
    <m-column v-else-if="id === 'multi-select'" gap="sm" align="center">
      <m-row gap="xs"
        ><m-column
          :width="64"
          :height="26"
          radius="full"
          :backgroundColor="color"
          align="center"
          justify="center"
          ><m-text variant="caption" tone="onPrimary">✓ A</m-text></m-column
        ><m-column
          :width="38"
          :height="26"
          radius="full"
          :backgroundColor="soft"
          align="center"
          justify="center"
          ><m-text variant="caption" tone="primary">B</m-text></m-column
        ></m-row
      >
      <m-column
        :width="86"
        :height="26"
        radius="full"
        :backgroundColor="theme.colors.accentSoft"
        align="center"
        justify="center"
        ><m-text variant="caption" tone="accent">✓ C</m-text></m-column
      >
    </m-column>
    <m-column
      v-else-if="id === 'image'"
      :width="104"
      :height="76"
      radius="md"
      :backgroundColor="soft"
      padding="sm"
      gap="xs"
      justify="between"
    >
      <m-row justify="end"
        ><m-box :width="20" :height="20" radius="full" :backgroundColor="color"
      /></m-row>
      <m-row gap="xs" align="end"
        ><m-box :width="40" :height="24" radius="sm" :backgroundColor="theme.colors.accent" /><m-box
          :grow="1"
          :height="16"
          radius="sm"
          :backgroundColor="color"
      /></m-row>
    </m-column>
    <m-row v-else gap="sm" justify="center" align="end">
      <m-box :width="24" :height="30" radius="sm" :backgroundColor="theme.colors.border" />
      <m-box :width="24" :height="50" radius="sm" :backgroundColor="theme.colors.accent" />
      <m-box :width="24" :height="72" radius="sm" :backgroundColor="color" />
    </m-row>
  </m-column>
</template>
