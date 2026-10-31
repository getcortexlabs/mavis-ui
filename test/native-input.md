# Input checks

Build the library with `npm run build`, then build the catalog from `examples/catalog`. Use `ns build android --no-hmr --env.inputCheck=contract` or `ns build ios --emulator --no-hmr --env.inputCheck=contract` and install on the intended simulator. The flag selects `/checks/input`; no test driver runs in the normal app. The same fixture is available at `/playground/#/checks/input` on Web.

## Editing contract

Before using the Focus button, tap Value while it is unfocused: the first tap must open the software keyboard and show the focus border. Blur and repeat, then check Password and Multiline the same way. On Android, also use a short stationary press and switch directly between editors. A blur, unload or removal before the queued focus feedback runs must not leave a focus border behind.

1. **External reset** displays `012345` in Value and the state line despite `maxLength=3`. **Short reset** returns to `ab`; typing `cde` at the end yields `abc`.
2. Select each return-key option, focus Value and use the actual keyboard action. Each action increments submits once and leaves editing focus in Value. A hardware Enter must not fire twice for its down/up pair.
3. Disable Value and use Focus: it stays disabled and unfocused. Enable it, make it Read only and repeat. Restore Editable and Focus: editing must work again. Blur must dismiss the keyboard and change the state line to blurred.
4. Password remains a secure editor. Its native accessibility value is masked and its description must never contain the raw fixture password. Labels remain Value, Password and Multiline.
5. Type several newlines into Multiline. The field grows; Enter inserts text without incrementing submits. With a docked keyboard, the editor's lower edge stays visible while the field is shorter than the available viewport.
6. Type into the middle of existing text, select/replace, paste and delete. Confirm the caret and model are preserved. IME intermediate text is allowed in the string model; the keyboard's composition-confirming Enter must not submit the form. Check real CJK keyboards on target devices before claiming coverage of those IMEs.

Use `--env.inputCheck=profile` for the shared profile editor and `--env.inputCheck=demo` for the component reference. In Profile, check Name → Email → Bio from the keyboard, invalid save focus, multiline growth, save/blur, discard and both themes. These are local demonstration values.

In the full Input reference, switch themes, scroll through all properties and events, then return to the catalog. Check that default-value badges keep their content height and that the page remains responsive. Deeply nested flex containers caused excessive measurement work here; the reference keeps its property rows flat. Opening only the isolated demo does not exercise this case.

## Screen integration

The existing `/checks/screen` fixture now uses MInput. Build with `--env.screenCheck` and run the commands in [native-screen.md](./native-screen.md). Its 12 stages cover scrolling, docked keyboard overlap, push/back, state retention, dismissal, rotation and background/resume. The iOS Screen listens for multiline text changes as well as keyboard/focus notifications, and releases those observers on unload.

Browser tests cover editing/caret, synthetic composition, maxLength versus external resets, focus methods, invalid state, readonly/disabled transitions, textarea growth, themes and profile save/discard. Synthetic composition is not evidence of a physical mobile IME. Physical devices, floating/split keyboards and fields taller than the available viewport remain part of #23.

Rebuild without the check flags and reinstall afterwards so the app opens on the normal catalog. Keep captures and device-specific review output under the ignored `artifacts/input` directory.
