import {
  Frame,
  GestureTypes,
  TextField,
  View,
  knownFolders,
  ApplicationSettings,
  isIOS,
} from '@nativescript/core'

interface RouterProbe {
  currentRoute: { value: { path: string } }
  back(): unknown
}
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
const wait = async (condition: () => unknown) => {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (condition()) {
      await delay(150)
      return
    }
    await delay(100)
  }
  throw new Error('Timed out waiting for the shared screen')
}
const tap = (id: string) => {
  const view = find(id)
  if (!view) throw new Error(`Missing native view ${id}`)
  const observers = view.getGestureObservers(GestureTypes.tap) ?? []
  if (observers.length)
    for (const observer of [...observers])
      observer.callback.call(observer.context, {
        eventName: 'tap',
        object: view,
        type: GestureTypes.tap,
        view,
        ios: undefined,
        android: undefined,
      })
  else view.notify({ eventName: 'tap', object: view })
}

/** Opt-in runtime check. Actions are synthetic NativeScript events on the generated real views. */
export async function runSharingProbe(router: RouterProbe, failNextWrite: () => void) {
  const observations: { name: string; value: unknown }[] = [],
    failures: string[] = []
  const check = (name: string, value: unknown, valid: boolean) => {
    observations.push({ name, value })
    if (!valid) failures.push(name)
  }
  try {
    await wait(() => find('directory-search')?.isLoaded)
    const search = find('directory-search') as TextField
    check('shared search is a native editor', search.constructor.name, search instanceof TextField)
    search.text = 'Porto'
    await wait(() => !find('entry-library'))
    check(
      'shared search filters native cards',
      Boolean(find('entry-garden')),
      Boolean(find('entry-garden') && find('entry-studio')),
    )
    tap('entry-garden')
    await wait(
      () => router.currentRoute.value.path === '/entries/garden' && find('edit-place')?.isLoaded,
    )
    check('card uses the app router', router.currentRoute.value.path, true)
    tap('edit-place')
    await wait(
      () =>
        router.currentRoute.value.path === '/entries/garden/edit' && find('place-name')?.isLoaded,
    )
    const editor = find('place-name') as TextField
    check('button navigation and route prop', editor.text, editor.text === 'Community garden')
    editor.text = 'Garden for everyone'
    await delay(200)
    failNextWrite()
    tap('save-place')
    await wait(() => find('save-error')?.isLoaded)
    check(
      'failed save preserves native draft',
      editor.text,
      editor.text === 'Garden for everyone' && editor === find('place-name'),
    )
    tap('save-place')
    await wait(
      () =>
        !find('save-error') &&
        ApplicationSettings.getString('mavis:directory', '').includes('Garden for everyone'),
    )
    check(
      'retry persists through the native host service',
      JSON.parse(ApplicationSettings.getString('mavis:directory'))[0].name,
      true,
    )
    await router.back()
    await wait(
      () => router.currentRoute.value.path === '/entries/garden' && find('edit-place')?.isLoaded,
    )
    check('native back returns to details', router.currentRoute.value.path, true)
    tap('places-home')
    await wait(() => router.currentRoute.value.path === '/' && find('directory-search')?.isLoaded)
    check(
      'link navigation retains app query',
      (find('directory-search') as TextField).text,
      (find('directory-search') as TextField).text === 'Porto',
    )
    check(
      'saved data is rendered in native card',
      find('entry-garden')?.accessibilityLabel,
      find('entry-garden')?.accessibilityLabel === 'Open Garden for everyone',
    )
    ;(find('directory-search') as TextField).text = 'No match anywhere'
    await wait(() => !find('entry-garden') && !find('entry-studio'))
    check('empty search removes result cards', true, true)
  } catch (error) {
    failures.push(String(error))
  }
  await knownFolders
    .documents()
    .getFile('sharing-check.json')
    .writeText(
      JSON.stringify(
        { done: true, platform: isIOS ? 'ios' : 'android', observations, failures },
        null,
        2,
      ),
    )
}
