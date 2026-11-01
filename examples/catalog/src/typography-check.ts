import { Application, Frame, Label, View, isIOS, knownFolders } from '@nativescript/core'

declare const NSFontAttributeName: string
declare const android: { text: { style: { AbsoluteSizeSpan: { class: unknown } } } }

// Opt-in device evidence. No timers or native inspection are included in normal builds.
let count = 0
const samples: unknown[] = []
const timer = setInterval(() => {
  const page = Frame.topmost()?.currentPage
  if (!page) return
  let headline: Label | undefined
  const walk = (view: View) => {
    if (view.id === 'studio-headline') headline = view as Label
    view.eachChildView((child) => {
      walk(child)
      return true
    })
  }
  walk(page)
  if (!headline?.nativeViewProtected) return
  const label = headline as Label
  const value = String(label.text)
  const runs = label.formattedText?.spans.map((span) => ({
    text: span.text,
    weight: span.fontWeight,
    style: span.fontStyle,
  }))
  let native: unknown
  if (isIOS) {
    const view = label.ios
    const attributed = view.attributedText
    const start = value.indexOf('Mais')
    const font = (at: number) => {
      const resolved = attributed?.attributeAtIndexEffectiveRange(NSFontAttributeName, at, null)
      return resolved ? { name: resolved.fontName, size: resolved.pointSize } : null
    }
    native = { plain: font(0), emphasized: font(start), labelSize: view.font.pointSize }
  } else {
    const view = label.android
    const text = view.getText()
    native = {
      textSize: view.getTextSize(),
      fontScale: Application.android.context.getResources().getConfiguration().fontScale,
      fixedSizeRuns: text.getSpans(0, text.length(), android.text.style.AbsoluteSizeSpan.class)
        .length,
    }
  }
  samples.push({ text: value, runs, native, size: label.getActualSize() })
  void knownFolders
    .documents()
    .getFile('typography-check.json')
    .writeText(JSON.stringify(samples, null, 2))
  if (++count === 20) clearInterval(timer)
}, 1500)
Application.on(Application.exitEvent, () => clearInterval(timer))
