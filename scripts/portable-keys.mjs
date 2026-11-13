// Translate the fixture key spelling to XCUITest without opening an application.
const named = {
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => [`F${index + 1}`, `F${index + 1}`]),
  ),
  Enter: 'return',
  Return: 'return',
  Escape: 'escape',
  Tab: 'tab',
  Home: 'home',
  End: 'end',
  ArrowUp: 'upArrow',
  ArrowDown: 'downArrow',
  ArrowLeft: 'leftArrow',
  ArrowRight: 'rightArrow',
}
const modifierNames = { Mod: '.command', Shift: '.shift', Alt: '.option', Control: '.control' }

export function swiftKey(input, context = 'conformance step') {
  const fail = () => {
    throw new TypeError(
      `${context}: unsupported Mac keyboard key ${JSON.stringify(input)}. Use one printable character, Enter/Return, Escape, Tab, Home/End, ArrowUp/Down/Left/Right or F1–F12; modifiers are Mod, Shift, Alt and Control.`,
    )
  }
  if (typeof input !== 'string' || !input) return fail()
  const parts = Array.from(input).length === 1 ? [input] : input.split('+')
  const key = parts.pop()
  const modifiers = parts.map((part) =>
    Object.hasOwn(modifierNames, part) ? modifierNames[part] : fail(),
  )
  if (new Set(modifiers).size !== modifiers.length) return fail()
  const flags = modifiers.length === 1 ? modifiers[0] : `[${modifiers.join(', ')}]`
  if (Object.hasOwn(named, key))
    return { key: `XCUIKeyboardKey.${named[key]}`, modifiers: flags, character: false }
  if (Array.from(key).length === 1 && key.codePointAt(0) >= 32 && key.codePointAt(0) !== 127)
    return { key: JSON.stringify(key), modifiers: flags, character: true }
  return fail()
}
