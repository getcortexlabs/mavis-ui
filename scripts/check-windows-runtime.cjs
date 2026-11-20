const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { dirname, resolve } = require('node:path')
const { readFileSync, writeFileSync } = require('node:fs')
const local = createRequire(resolve('artifacts/windows-runtime/package.json'))
const { Windows, XamlWindow, native, toPromise, awaitWithPump } = local(
  '@nativescript/windows-napi',
)
const controls = Windows.UI.Xaml.Controls
const window = new XamlWindow({ title: 'Mavis Windows runtime acceptance', theme: 'light' })
const root = new controls.StackPanel()
const title = new controls.TextBlock()
title.Text = 'Mavis on Windows'
const field = new controls.TextBox()
field.Header = 'Name'
field.Text = 'Ada'
let changes = 0
field.TextChanged = () => {
  changes++
}
const button = new controls.Button()
button.Content = 'Count 0'
let clicks = 0
button.Click = () => {
  button.Content = `Count ${++clicks}`
}
root.Children.Append(title)
root.Children.Append(field)
root.Children.Append(button)
window.content = root
window.place({ width: 480, height: 320 })
window.show()
const checks = []
const check = (name, value) => {
  assert(value, name)
  checks.push(name)
}
const pump = async () => {
  native.pumpMessages()
  await new Promise((r) => setTimeout(r, 20))
}
;(async () => {
  for (let i = 0; i < 50; i++) await pump()
  const raster = new Windows.UI.Xaml.Media.Imaging.RenderTargetBitmap()
  await awaitWithPump(toPromise(raster.RenderAsync(root)), 10000)
  const { promisify } = require('node:util')
  const capture = promisify(require('node:child_process').execFile)
  const capturePump = setInterval(() => native.pumpMessages(), 8)
  try {
    await capture('pwsh', [
      '-NoProfile',
      '-File',
      resolve('scripts/capture-desktop-window.ps1'),
      '-WindowHandle',
      String(window.hwnd),
      '-Output',
      resolve('artifacts/windows-runtime/initial.png'),
    ])
  } finally {
    clearInterval(capturePump)
  }
  check('native window is visible', window.visible)
  check('native TextBox rendered', field.Text === 'Ada' && field.ActualWidth > 0)
  field.Text = 'Grace'
  for (let i = 0; i < 10; i++) await pump()
  check('native TextChanged callback delivered', changes > 0 && field.Text === 'Grace')
  const peer = new Windows.UI.Xaml.Automation.Peers.ButtonAutomationPeer(button)
  peer.GetPattern(Windows.UI.Xaml.Automation.Peers.PatternInterface.Invoke).Invoke()
  for (let i = 0; i < 10; i++) await pump()
  check('native Button invocation delivered', clicks === 1)
  window.close()
  for (let i = 0; i < 10; i++) await pump()
  check('native window closed', window.closed)
  const manifest = JSON.parse(
    readFileSync(
      resolve(dirname(local.resolve('@nativescript/windows-napi')), 'package.json'),
      'utf8',
    ),
  )
  const report = { checks, runtime: manifest.version }
  writeFileSync('artifacts/windows-runtime/report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
})().then(
  () => process.exit(0),
  (error) => {
    console.error(error)
    process.exit(1)
  },
)
