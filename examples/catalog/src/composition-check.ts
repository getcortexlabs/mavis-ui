import { checkOrchestration } from './orchestration-check'
import { Application, Frame, Label, View, isAndroid, knownFolders } from '@nativescript/core'
import { nextTick } from 'nativescript-vue'
import { createAppIcons } from '@getcortexlabs/mavis/app-icons'
import { appIconChoices } from '../shared/app-icons'

// Opt-in device probe; excluded from normal bundles by DefinePlugin.
const samples: { name: string; value: unknown }[] = []
const failures: string[] = []
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const record = (name: string, value: unknown, pass = true) => {
  samples.push({ name, value })
  if (!pass) failures.push(name)
}
const page = () => Frame.topmost()?.currentPage
const find = (id: string) => page()?.getViewById<View>(id)
const tap = (id: string) => {
  const view = find(id)!
  view.notify({ eventName: 'tap', object: view })
}
declare const __ORCHESTRATION_ONLY__: boolean
async function run() {
  if (__ORCHESTRATION_ONLY__) {
    for (let attempt = 0; attempt < 80 && !find('reveal-toggle'); attempt++) await delay(100)
    return checkOrchestration(record)
  }
  for (let attempt = 0; attempt < 80 && !find('reveal-toggle'); attempt++) await delay(100)
  if (!find('reveal-toggle')) throw new Error('Composition fixture did not mount')
  await delay(500)
  tap('reveal-toggle')
  await delay(500)
  const panel = find('reveal-panel')!
  record('open height', panel?.getActualSize(), Boolean(panel && panel.getActualSize().height > 40))
  const editor = find('reveal-editor')
  tap('reveal-extra')
  await delay(150)
  const taller = panel.getActualSize().height
  tap('reveal-toggle')
  await nextTick()
  record('closing retains subtree', Boolean(find('reveal-panel')), find('reveal-panel') === panel)
  tap('reveal-toggle')
  await delay(450)
  record(
    'reversal retains editor',
    Boolean(find('reveal-editor')),
    find('reveal-editor') === editor,
  )
  record(
    'auto height after reversal',
    panel.getActualSize().height,
    Math.abs(panel.getActualSize().height - taller) < 2,
  )
  tap('reveal-toggle')
  await delay(400)
  record('closed removes content', Boolean(find('reveal-panel')), !find('reveal-panel'))
  const button = find('scaled-icon-button')!
  const labels: Label[] = []
  const visit = (view: View) => {
    if (view instanceof Label) labels.push(view)
    view.eachChildView((child) => {
      visit(child)
      return true
    })
  }
  visit(button)
  record(
    'icon button label',
    labels.map((label) => ({
      text: label.text,
      size: label.getActualSize(),
      ...(isAndroid
        ? {
            pixels: label.android.getTextSize(),
            scale: Application.android.context.getResources().getConfiguration().fontScale,
          }
        : {}),
    })),
    !isAndroid || labels.some((label) => label.text === 'A button with an icon'),
  )
  const icons = createAppIcons({ primary: 'mavis', icons: appIconChoices })
  const initial = icons.current()
  try {
    record('icons supported', icons.supported(), icons.supported())
    await icons.select('midnight')
    record('midnight selected', icons.current(), icons.current() === 'midnight')
    await icons.select('azure')
    record('azure selected', icons.current(), icons.current() === 'azure')
  } finally {
    if (initial) await icons.select(initial)
    else await icons.reset()
  }
  record('original restored', icons.current(), icons.current() === (initial ?? 'mavis'))
  await checkOrchestration(record)
}
void run()
  .catch((error) => failures.push(String(error?.stack ?? error)))
  .finally(async () => {
    await knownFolders
      .documents()
      .getFile('composition-check.json')
      .writeText(JSON.stringify({ done: true, samples, failures }, null, 2))
  })
