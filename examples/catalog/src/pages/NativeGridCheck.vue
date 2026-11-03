<script setup lang="ts">
import { onMounted, nextTick, ref } from 'nativescript-vue'
import { formatDateTime, dateTimeToCivilDate } from '@getcortexlabs/mavis/date-format'
import type { CivilDate } from '@getcortexlabs/mavis-core'
import { Frame, View, TextField, knownFolders, isIOS } from '@nativescript/core'

const date = ref<CivilDate | null>('2026-11-03')
const width = ref(360)
const order = ref([1, 2, 3])
const drafts = ref<Record<number, string>>({ 1: '', 2: '', 3: '' })
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
function find(id: string, root: View | undefined = Frame.topmost()?.currentPage): View | undefined {
  if (!root || root.id === id) return root
  let result: View | undefined
  root.eachChildView((child) => {
    result = find(id, child)
    return !result
  })
  return result
}
function action(root: View | undefined = Frame.topmost()?.currentPage): View | undefined {
  if (!root || root.accessibilityLabel === 'Escolher data: Data local') return root
  let result: View | undefined
  root.eachChildView((child) => {
    result = action(child)
    return !result
  })
  return result
}
onMounted(async () => {
  const samples: { name: string; value: unknown }[] = []
  const failures: string[] = []
  const check = (name: string, value: unknown, valid: boolean) => {
    samples.push({ name, value })
    if (!valid) failures.push(name)
  }
  try {
    for (let attempt = 0; attempt < 60 && !find('grid-cell-1')?.getActualSize().width; attempt++)
      await delay(100)
    await delay(400)
    const editor = find('grid-cell-1') as TextField
    const second = find('grid-cell-2')!
    const point = (view: View) => view.getLocationRelativeTo(find('native-grid')!)
    const wide = [point(editor), point(second)]
    check(
      'two columns and token gap',
      wide,
      Math.abs(wide[0].y - wide[1].y) < 1 && wide[1].x > wide[0].x + editor.getActualSize().width,
    )
    editor.text = 'Native retained draft'
    await nextTick()
    width.value = 180
    await delay(400)
    const narrow = [point(editor), point(second)]
    check(
      'one column after resize',
      narrow,
      Math.abs(narrow[0].x - narrow[1].x) < 1 && narrow[1].y > narrow[0].y,
    )
    order.value.reverse()
    await delay(400)
    check(
      'keyed editor and draft retained',
      { same: editor === find('grid-cell-1'), text: editor.text },
      editor === find('grid-cell-1') && editor.text === 'Native retained draft',
    )
    check(
      'reorder moves existing cells',
      [point(editor), point(second)],
      point(editor).y > point(second).y,
    )
    width.value = 360
    await delay(400)
    check(
      'restores two columns',
      [point(editor), point(second)],
      point(editor).y > point(second).y && find('grid-cell-3')!.getActualSize().width < 200,
    )
    const fixed = find('grid-fixed-1')!
    const last = find('grid-fixed-2')!
    check(
      'fixed columns',
      [fixed.getLocationOnScreen(), last.getLocationOnScreen()],
      Math.abs(fixed.getLocationOnScreen().y - last.getLocationOnScreen().y) < 1 &&
        last.getLocationOnScreen().x > fixed.getLocationOnScreen().x,
    )
    const dateEditor = find('native-date') as TextField
    check('localized civil date', dateEditor.text, dateEditor.text === '03/11/2026')
    const calendar = action()!
    const center = (view: View) => view.getLocationOnScreen().y + view.getActualSize().height / 2
    const alignment = Math.abs(center(dateEditor) - center(calendar))
    check('calendar aligns with editor including help', alignment, alignment < 1)

    dateEditor.text = '04/11/2026'
    await nextTick()
    check('localized edit emits ISO', date.value, date.value === '2026-11-04')
    dateEditor.text = '04/11/'
    await nextTick()
    check(
      'incomplete localized draft remains',
      dateEditor.text,
      dateEditor.text === '04/11/' && date.value === '2026-11-04',
    )
    const instant = new Date('2026-11-03T01:30:00Z')
    const local = formatDateTime(instant, {
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
    })
    check('native localized formatter', local, /02.*11.*(?:2026|26)/.test(local))
    const civil = dateTimeToCivilDate(instant, { timeZone: 'America/Sao_Paulo' })
    check('explicit timezone day conversion', civil, civil === '2026-11-02')
    const ancient = dateTimeToCivilDate(new Date('0001-01-01T12:00:00Z'), { timeZone: 'UTC' })
    check('proleptic Gregorian conversion', ancient, ancient === '0001-01-01')
    const options = { locale: 'en-US', timeZone: 'America/New_York', timeStyle: 'short' as const }
    const dst = [
      formatDateTime(new Date('2026-03-08T06:30:00Z'), options),
      formatDateTime(new Date('2026-03-08T07:30:00Z'), options),
    ]
    check('native DST transition', dst, /1:30/.test(dst[0]!) && /3:30/.test(dst[1]!))
    let invalidZone = false
    try {
      formatDateTime(instant, { timeZone: 'Not/AZone' })
    } catch {
      invalidZone = true
    }
    check('invalid timezone rejected', invalidZone, invalidZone)
  } catch (error) {
    failures.push(String((error as Error)?.stack ?? error))
  }
  await knownFolders
    .documents()
    .getFile('grid-check.json')
    .writeText(
      JSON.stringify(
        { done: true, platform: isIOS ? 'ios' : 'android', samples, failures },
        null,
        2,
      ),
    )
})
</script>

<template>
  <m-screen>
    <m-column padding="sm" gap="md">
      <m-text as="h1">Native Grid and date checks</m-text>
      <m-date-picker
        id="native-date"
        v-model="date"
        label="Data local"
        locale="pt-BR"
        dateFormat="locale"
        helperText="Ajuda localizada que mantém o calendário alinhado ao campo."
        initialMonth="2026-11"
      />
      <m-grid id="native-grid" :width="width" :columns="3" :minColumnWidth="150" gap="md">
        <template v-for="id in order" :key="id">
          <m-input :id="`grid-cell-${id}`" v-model="drafts[id]" :label="`Cell ${id}`" />
        </template>
      </m-grid>
      <m-grid :columns="2" :width="360" gap="sm">
        <m-text id="grid-fixed-1">First</m-text>
        <m-text id="grid-fixed-2">Second</m-text>
      </m-grid>
    </m-column>
  </m-screen>
</template>
