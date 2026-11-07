import { schedulerParts } from '../../../packages/nativescript/src/native/date-format'
import { cropExif } from '../shared/assets/crop-exif'
import { loadCropImage } from '../../../packages/nativescript/src/native/image-crop'
import {
  fitImageCrop,
  schedulerInstant,
  civilDate,
  type CropRotation,
} from '@getcortexlabs/mavis-core'
import { cropQuadrants } from '../shared/assets/crop-quadrants'
import {
  File,
  ImageSource,
  Frame,
  View,
  Button,
  GestureTypes,
  TextField,
  knownFolders,
  isIOS,
} from '@nativescript/core'
import { nextTick } from 'nativescript-vue'
const samples: { name: string; value: unknown }[] = []
const failures: string[] = []
export function recordError(error: unknown) {
  failures.push(String((error as Error)?.stack ?? error))
}
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
function views(root: View | undefined = Frame.topmost()?.currentPage): View[] {
  if (!root) return []
  const result = [root]
  root.eachChildView((child) => {
    result.push(...views(child))
    return true
  })
  return result
}
const find = (id: string) => views().find((view) => view.id === id)
const text = (id: string) => (find(id) as { text?: string } | undefined)?.text ?? ''
const named = (label: string) => views().find((view) => view.accessibilityLabel === label)
function tap(view: View | undefined, point?: { x: number; y: number }) {
  if (!view)
    throw new Error(
      'Missing native control: ' +
        views()
          .map((v) => v.accessibilityLabel)
          .filter(Boolean)
          .join(' | '),
    )
  const observers = view instanceof Button ? [] : (view.getGestureObservers(GestureTypes.tap) ?? [])
  if (observers.length)
    observers.forEach((observer) =>
      observer.callback.call(observer.context, {
        eventName: 'tap',
        object: view,
        getX: () => point?.x ?? 0,
        getY: () => point?.y ?? 0,
      } as never),
    )
  else view.notify({ eventName: 'tap', object: view })
}
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
}
async function waitFor(check: () => boolean, description = 'interactive state') {
  for (let n = 0; n < 120; n++) {
    if (check()) return
    await delay(50)
  }
  throw new Error(
    `Timed out waiting for ${description}; controls: ${views()
      .map((v) => v.accessibilityLabel)
      .filter(Boolean)
      .join(' | ')}`,
  )
}
async function next(check: () => boolean) {
  tap(find('advanced-next'))
  await waitFor(check)
  await delay(350)
}
async function run() {
  const clock = {
      parts: (instant: number, timeZone: string) => schedulerParts(instant, { timeZone }),
    },
    zone = 'America/New_York'
  const repeated = { date: civilDate('2026-11-01'), minute: 90 }
  const earlier = schedulerInstant(repeated, zone, clock, 'earlier')
  const later = schedulerInstant(repeated, zone, clock, 'later')
  record(
    'native clock disambiguates repeated DST hour',
    later - earlier,
    later - earlier === 3600000,
  )
  let rejectsGap = false
  try {
    schedulerInstant({ date: civilDate('2026-03-08'), minute: 150 }, zone, clock)
  } catch {
    rejectsGap = true
  }
  record('native clock rejects missing DST hour', rejectsGap, rejectsGap)

  const source = await loadCropImage(cropQuadrants)
  try {
    for (const rotation of [0, 90, 180, 270] as CropRotation[]) {
      const result = await source.export(fitImageCrop(source, 1, rotation), {
        mimeType: 'image/png',
        quality: 1,
        width: 40,
      })
      const target = knownFolders.documents().path + `/advanced-crop-${rotation}.png`
      if (File.exists(target)) await File.fromPath(target).remove()
      const copy = File.fromPath(target)
      if (!(await File.fromPath(result.uri).copy(copy.path)))
        throw new Error('Could not copy crop evidence')
      const decoded = ImageSource.fromFileOrResourceSync(copy.path)
      record(
        `decoded crop ${rotation}`,
        { width: decoded.width, height: decoded.height },
        decoded.width === 40 && decoded.height === 40,
      )
      await result.dispose()
      record(`temporary crop ${rotation} released`, result.uri, !File.exists(result.uri))
    }
  } finally {
    source.dispose()
  }

  for (let orientation = 1; orientation <= 8; orientation++) {
    const source = await loadCropImage(cropExif[orientation]!)
    try {
      const result = await source.export(fitImageCrop(source, 1), {
        mimeType: 'image/png',
        quality: 1,
        width: 40,
      })
      const target = knownFolders.documents().path + `/advanced-exif-${orientation}.png`
      if (File.exists(target)) await File.fromPath(target).remove()
      if (!(await File.fromPath(result.uri).copy(target)))
        throw new Error('EXIF evidence copy failed')
      record(
        `EXIF ${orientation} normalized`,
        { width: source.width, height: source.height },
        source.width === (orientation >= 5 ? 40 : 80) &&
          source.height === (orientation >= 5 ? 80 : 40),
      )
      await result.dispose()
    } finally {
      source.dispose()
    }
  }
  await waitFor(() => !!find('tree-select-value'))
  tap(named('Lettering'))
  await delay(250)
  const search = views().find((v) => v instanceof TextField) as TextField
  if (!search) throw new Error('TreeSelect search missing')
  search.text = 'Color systems'
  await nextTick()
  await delay(300)
  await waitFor(() => !!named('Color systems'), 'search result: ' + search.text)
  tap(named('Color systems'))
  await waitFor(() => text('tree-select-value').includes('color'))
  record(
    'tree search and multiple selection',
    text('tree-select-value'),
    text('tree-select-value') === 'lettering,color',
  )
  tap(named('Lettering, Color systems'))
  await delay(150)
  await next(() => !!find('studio-masonry'))
  const editor = views().find(
    (v) => v instanceof TextField && v.accessibilityLabel === 'A thought to keep',
  ) as TextField | undefined
  if (!editor) throw new Error('Masonry draft editor missing')
  editor.text = 'Native draft'
  tap(named('Reverse collection'))
  await delay(350)
  record(
    'masonry retains all cards',
    views().filter((v) => v.id?.startsWith('masonry-')).length,
    views().filter((v) => v.id?.startsWith('masonry-')).length === 6,
  )
  record('masonry retains editor', editor.text, editor.text === 'Native draft')
  await next(() => !!find('heatmap-value'))
  tap(named('2026-09-02: 7'))
  await waitFor(() => text('heatmap-value') === '2026-09-02')
  tap(named('Another chapter'))
  record(
    'heatmap keeps selected civil date',
    text('heatmap-value'),
    text('heatmap-value') === '2026-09-02',
  )
  await next(() => !!find('crop-value'))
  await waitFor(() => {
    const v = named('Export image')
    return !!v && v.isEnabled
  }, 'decoded image')
  tap(named('Rotate clockwise'))
  await waitFor(() => text('crop-value').endsWith(',90'))
  tap(named('Export image'))
  await waitFor(() => text('crop-result') === '480 × 480', 'native PNG export')
  record('native image export dimensions', text('crop-result'), text('crop-result') === '480 × 480')
  await next(() => !!find('studio-scheduler'))
  tap(
    views().find((v) => v instanceof Button && v.accessibilityLabel?.startsWith('A small pause ·')),
  )
  await delay(100)
  tap(named('Later'))
  await waitFor(() => text('scheduler-result') === 'note:2026-11-02T18:15:00.000Z')
  record('scheduler uses native timezone and preserves instants', text('scheduler-result'), true)
  await next(() => !!find('notification-state'))
  tap(named('Open edition'))
  await waitFor(() => text('notification-action') === 'edition')
  tap(named('Unread'))
  await delay(100)
  tap(named('Mark as read: The autumn edition is ready'))
  await waitFor(() => text('notification-state').includes('edition:true'))
  tap(named('All'))
  await delay(100)
  tap(named('Dismiss: A fresh pair of eyes'))
  await waitFor(() => !text('notification-state').includes('feedback'))
  record(
    'notification controlled actions preserve unrelated messages',
    text('notification-state'),
    text('notification-state').includes('welcome:true'),
  )
  record(
    'finite native geometry',
    views().length,
    views().every((v) => {
      const s = v.getActualSize()
      return Number.isFinite(s.width) && Number.isFinite(s.height)
    }),
  )
}
void (async () => {
  try {
    await run()
  } catch (error) {
    recordError(error)
  }
  const report = { platform: isIOS ? 'ios' : 'android', done: true, samples, failures }
  await knownFolders
    .documents()
    .getFile('advanced-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_ADVANCED_CHECK', JSON.stringify(report))
})()
